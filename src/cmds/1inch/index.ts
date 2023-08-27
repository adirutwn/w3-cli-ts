import { Command } from 'commander'
import { Cmd } from '../interface'
import { AccountRepo } from '../../repos/account'
import { ConfigRepo } from '../../repos/config'
import { Spinner } from '../../uis/spinner'
import { TwapOpts } from './opts'
import { sleep } from '../../utils/time'
import chainInfo from '../../entities/chain-info'
import { ethers } from 'ethers'
import { abi as Erc20Abi } from '../../abis/ERC20.json'
import { MulticallWrapper } from '../../wrappers/MulticallWrapper'
import { OneInchWrapper } from '../../wrappers/1inchWrapper'

export class OneInchCmd implements Cmd {
  private cmd: Command
  private accountRepo: AccountRepo
  private configRepo: ConfigRepo
  private spinner: Spinner

  constructor(accountRepo: AccountRepo, configRepo: ConfigRepo, spinner: Spinner) {
    this.accountRepo = accountRepo
    this.configRepo = configRepo
    this.spinner = spinner

    this.cmd = new Command('1inch')
    this.cmd.description('Swap tokens on 1inch')

    this.cmd
      .command('twap')
      .requiredOption('-c, --chain-id <chainId>', 'Chain ID', parseInt)
      .requiredOption('-ft, --fromToken <fromTokenAddress>', 'The token to swap from')
      .requiredOption('-tt, --toToken <toTokenAddress>', 'The token to swap to')
      .requiredOption('-a, --amount <amount>', 'The amount to swap', parseFloat)
      .requiredOption('-s, --signer <signerLabel>', 'Signer to execute a transaction')
      .action(async (opts: TwapOpts) => {
        const chain = chainInfo[opts.chainId]
        const signer = new ethers.Wallet(
          (await this.accountRepo.getAccountByLabel(opts.signer)).key,
          chain.jsonRpcProvider,
        )
        const signerAddress = await signer.getAddress()
        const fromToken = new ethers.Contract(opts.fromToken, Erc20Abi, signer)
        const toToken = new ethers.Contract(opts.toToken, Erc20Abi, signer)
        const multicallWrapper = new MulticallWrapper('0xcA11bde05977b3631167028862bE2a173976CA11', signer)
        const oneInchKey = (await this.configRepo.getConfigByKey('1INCH_API_KEY')).value
        const oneInchWrapper = new OneInchWrapper(
          'https://api.1inch.dev/swap/v5.2',
          opts.chainId,
          multicallWrapper,
          signer,
          [],
          oneInchKey,
        )

        const [fromTokenSymbol, fromDecimals, toTokenSymbol, toDecimals] = await Promise.all([
          fromToken.symbol(),
          fromToken.decimals(),
          toToken.symbol(),
          toToken.decimals(),
        ])
        const amountWei = ethers.utils.parseUnits(opts.amount.toString(), fromDecimals)

        console.log(`> Twapping ${opts.amount} ${fromTokenSymbol} -> ${toTokenSymbol} per tx`)
        console.log(`> Signer: ${signerAddress}`)

        // watch
        console.log(`> Running TWAP...`)
        while (1) {
          const [fromTokenBalance] = await Promise.all([fromToken.balanceOf(signerAddress)])
          const randFactor = true
          if (randFactor) {
            // If rand said sell, then swap
            const swapAmount = fromTokenBalance.lt(amountWei) ? fromTokenBalance : amountWei
            try {
              await oneInchWrapper.swapExactTokensForTokens(fromToken.address, toToken.address, [], swapAmount, 25, 3)
              console.log(`> 🟢 Done`)
            } catch (e) {
              console.log(`> 🔴 Something wrong!`)
              console.error(e)
              console.log(`> 🟡 Retry in the next execution`)
            }
          } else {
            console.log(`> 🟡 Skip this execution`)
          }
          console.log(`> 🟡 Sleep for 15 minutes`)
          await sleep(900000)
        }
      })
  }

  public getCmdInstance(): Command {
    return this.cmd
  }
}
