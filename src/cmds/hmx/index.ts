import { Command } from 'commander'
import { Cmd } from '../interface'
import { AccountRepo } from '../../repos/account'
import { HedgeOpts } from './opts'
import chainInfo from '../../entities/chain-info'
import { ethers } from 'ethers'
import { abi as HmxLimitTradeHandlerAbi } from '../../abis/HmxLimitTradeHandler.json'

export class HmxCmd implements Cmd {
  private cmd: Command
  private accountRepo: AccountRepo

  constructor(accountRepo: AccountRepo) {
    this.accountRepo = accountRepo

    this.cmd = new Command('hmx')
    this.cmd.description('Commands for interacting with HMX')

    this.cmd
      .command('hedge')
      .requiredOption('-s, --size <amount>', 'The size to hedge', parseFloat)
      .requiredOption('-mi, --market-index <market-index>', 'The market index to hedge', parseInt)
      .requiredOption('-ls, --long-signer <long-signer>', 'Signer to take a long position')
      .requiredOption('-ss, --short-signer <short-signer>', 'Signer to take a short position')
      .action(async (opts: HedgeOpts) => {
        const chain = chainInfo[81457]
        const longSigner = new ethers.Wallet(
          (await this.accountRepo.getAccountByLabel(opts.longSigner)).key,
          chain.jsonRpcProvider,
        )
        const longSignerAddress = await longSigner.getAddress()

        const shortSigner = new ethers.Wallet(
          (await this.accountRepo.getAccountByLabel(opts.shortSigner)).key,
          chain.jsonRpcProvider,
        )
        const shortSignerAddress = await shortSigner.getAddress()

        console.log(`> Long Signer: ${longSignerAddress}`)
        console.log(`> Short Signer: ${shortSignerAddress}`)

        const limitTradeHandlerAsLongSigner = new ethers.Contract(
          '0xcf533D0eEFB072D1BB68e201EAFc5368764daA0E',
          HmxLimitTradeHandlerAbi,
          longSigner,
        )
        const limitTradeHandlerAsShortSigner = new ethers.Contract(
          '0xcf533D0eEFB072D1BB68e201EAFc5368764daA0E',
          HmxLimitTradeHandlerAbi,
          shortSigner,
        )

        const minExecutionFee = await limitTradeHandlerAsLongSigner.minExecutionFee()

        console.log(`> Enter hedge positions`)
        const txs = await Promise.all([
          limitTradeHandlerAsLongSigner[
            'createOrder(address,uint8,uint256,int256,uint256,uint256,bool,uint256,bool,address)'
          ](
            longSignerAddress, // mainAccount
            0, // subAccountId
            opts.marketIndex, // marketIndex
            ethers.utils.parseUnits(opts.size.toString(), 30), // sizeDelta
            0, // triggerPrice
            ethers.constants.MaxUint256, // acceptablePrice
            true, // triggerAboveThreshold
            minExecutionFee, // executionFee
            false, // reduceOnly
            '0x4300000000000000000000000000000000000003',
            { value: minExecutionFee },
          ),
          limitTradeHandlerAsShortSigner[
            'createOrder(address,uint8,uint256,int256,uint256,uint256,bool,uint256,bool,address)'
          ](
            shortSignerAddress, // mainAccount
            0, // subAccountId
            opts.marketIndex, // marketIndex
            ethers.utils.parseUnits(opts.size.toString(), 30).mul('-1'), // sizeDelta
            0, // triggerPrice
            0, // acceptablePrice
            true, // triggerAboveThreshold
            minExecutionFee, // executionFee
            false, // reduceOnly
            '0x4300000000000000000000000000000000000003',
            { value: minExecutionFee },
          ),
        ])

        console.log(`> Hedge positions created`)
        console.log(`> Long tx: ${txs[0].hash}`)
        console.log(`> Short tx: ${txs[1].hash}`)
      })
  }

  public getCmdInstance(): Command {
    return this.cmd
  }
}
