import { Command } from 'commander'
import { ethers } from 'ethers'
import { AccountRepo } from '../../repos/account'
import { Spinner } from '../../uis/spinner'
import { Cmd } from '../interface'
import { AccountAddOpts } from './opts'

export class AccountCmd implements Cmd {
  private cmd: Command
  private accountRepo: AccountRepo
  private spinner: Spinner

  constructor(accountRepo: AccountRepo, spinner: Spinner) {
    this.accountRepo = accountRepo
    this.spinner = spinner

    this.cmd = new Command('account')
    this.cmd.description('Add and remove key accounts')

    this.cmd
      .command('add')
      .requiredOption('-l, --label <label> Label to the adding account')
      .option('-k, --key <key> Key of the adding account')
      .action(async (options: AccountAddOpts) => {
        this.spinner.start(`Adding a new ${options.label} account`)

        let signer: ethers.Wallet
        if (!options.key) {
          // If key is not provided, create a random account
          signer = ethers.Wallet.createRandom()
          options.key = signer.privateKey
        } else {
          // If key is provided, use it
          signer = new ethers.Wallet(options.key)
        }

        await this.accountRepo.addAccounts([
          {
            label: options.label,
            address: signer.address,
            key: options.key,
          },
        ])
        this.spinner.succeed(`${options.label} has been added`)
      })

    this.cmd.command('list').action(async () => {
      const accounts = await this.accountRepo.getAllAccounts()
      console.table(
        accounts.map((account) => ({
          label: account.label,
          address: account.address,
          key: '*****',
        })),
      )
    })
  }

  public getCmdInstance(): Command {
    return this.cmd
  }
}
