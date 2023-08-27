import { Command } from 'commander'
import { AccountRepo } from '../../repos/account'
import { Spinner } from '../../uis/spinner'
import { TransferOpts } from './opts'
import { Cmd } from '../interface'
import chainInfo from '../../entities/chain-info'
import { ethers } from 'ethers'

export class NativeCmd implements Cmd {
  private cmd: Command
  private accountRepo: AccountRepo
  private spinner: Spinner

  constructor(accountRepo: AccountRepo, spinner: Spinner) {
    this.accountRepo = accountRepo
    this.spinner = spinner

    this.cmd = new Command('native')
    this.cmd.description('Interact with a native token')

    this.cmd
      .command('transfer')
      .requiredOption('-c, --chain-id <chainId>', 'Chain ID', parseInt)
      .requiredOption('-a, --amount <amount>', 'The amount to transfer', parseFloat)
      .requiredOption('-to, --to <toAddress>', 'The address to transfer to')
      .requiredOption('-s, --signer <signerLabel>', 'Signer to execute a transaction')
      .action(async (opts: TransferOpts) => {
        const chain = chainInfo[opts.chainId]
        const signer = new ethers.Wallet(
          (await this.accountRepo.getAccountByLabel(opts.signer)).key,
          chain.jsonRpcProvider,
        )

        this.spinner.start(`Transferring ${opts.amount} ${chain.nativeSymbol} to ${opts.to}`)
        const tx = await signer.sendTransaction({ to: opts.to, value: ethers.utils.parseEther(opts.amount.toString()) })
        this.spinner.info(`⛓️ Tx hash: ${tx.hash}, waiting for confirmation`)
        await tx.wait(3)
        this.spinner.succeed(`Transferred ${opts.amount} ${chain.nativeSymbol} to ${opts.to} succeeded`)
      })
  }

  getCmdInstance(): Command {
    return this.cmd
  }
}
