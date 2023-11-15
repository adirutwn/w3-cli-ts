import { Command } from 'commander'
import { Spinner } from '../../uis/spinner'
import { Cmd } from '../interface'
import { BlockOpts, FeeDataOpts } from './opts'
import chainInfo from '../../entities/chain-info'

export class ChainCmd implements Cmd {
  private cmd: Command
  private spinner: Spinner

  constructor(spinner: Spinner) {
    this.spinner = spinner

    this.cmd = new Command('chain')
    this.cmd.description('Query chain info')

    this.cmd
      .command('block')
      .requiredOption('-c, --chain-id <chainId>', 'Chain ID', parseInt)
      .option('-b, --block-number <blockNumber>', 'Block number to query info', parseInt)
      .action(async (opts: BlockOpts) => {
        const chain = chainInfo[opts.chainId]
        const blockNumber = opts.blockNumber ?? (await chain.jsonRpcProvider.getBlockNumber())
        console.log(await chain.jsonRpcProvider.getBlock(blockNumber))
      })

    this.cmd
      .command('fee-data')
      .requiredOption('-c, --chain-id <chainId>', 'Chain ID', parseInt)
      .action(async (opts: FeeDataOpts) => {
        const chain = chainInfo[opts.chainId]
        console.log(await chain.jsonRpcProvider.getFeeData())
      })
  }

  public getCmdInstance(): Command {
    return this.cmd
  }
}
