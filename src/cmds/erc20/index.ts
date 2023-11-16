import { Command } from 'commander'
import { AccountRepo } from '../../repos/account'
import { Spinner } from '../../uis/spinner'
import { TransferOpts } from './opts'
import { Cmd } from '../interface'
import { abi as Erc20Abi } from '../../abis/ERC20.json'
import chainInfo from '../../entities/chain-info'
import { ethers } from 'ethers'
import { MulticallWrapper } from '../../wrappers/MulticallWrapper'

export class Erc20Cmd implements Cmd {
  private cmd: Command
  private accountRepo: AccountRepo
  private spinner: Spinner

  constructor(accountRepo: AccountRepo, spinner: Spinner) {
    this.accountRepo = accountRepo
    this.spinner = spinner

    this.cmd = new Command('erc20')
    this.cmd.description('Interact with ERC20 tokens')

    this.cmd
      .command('transfer')
      .requiredOption('-c, --chain-id <chainId>', 'Chain ID', parseInt)
      .requiredOption('-t, --token <tokenAddress>', 'Token address')
      .requiredOption('-a, --amount <amount>', 'The amount to transfer', parseFloat)
      .requiredOption('-to, --to <toAddress>', 'The address to transfer to')
      .requiredOption('-s, --signer <signerLabel>', 'Signer to execute a transaction')
      .action(async (opts: TransferOpts) => {
        const chain = chainInfo[opts.chainId]
        const signer = new ethers.Wallet(
          (await this.accountRepo.getAccountByLabel(opts.signer)).key,
          chain.jsonRpcProvider,
        )
        const multicallWrapper = new MulticallWrapper(
          '0xcA11bde05977b3631167028862bE2a173976CA11',
          chain.jsonRpcProvider,
        )

        const token = new ethers.Contract(opts.token, Erc20Abi, signer)
        const tokenInfo = await multicallWrapper.multiContractCall<Array<string | ethers.BigNumber>>([
          { contract: token, function: 'symbol' },
          { contract: token, function: 'decimals' },
        ])

        let gasPrice = undefined
        if (opts.chainId == 56) {
          // if chain is BSC, set gas price to 3.5 gwei
          gasPrice = ethers.utils.parseUnits('3.5', 'gwei')
        }

        this.spinner.start(`Transferring ${opts.amount} ${tokenInfo[0]} to ${opts.to}`)
        const tx = await token.transfer(opts.to, ethers.utils.parseUnits(opts.amount.toString(), tokenInfo[1]), {
          gasPrice,
        })
        this.spinner.info(`⛓️ Tx hash: ${tx.hash}, waiting for confirmation`)
        await tx.wait(3)
        this.spinner.succeed(`Transfer ${opts.amount} ${tokenInfo[0]} to ${opts.to} succeeded`)
      })
  }

  getCmdInstance(): Command {
    return this.cmd
  }
}
