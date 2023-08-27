import { Command } from 'commander'
import { ethers } from 'ethers'
import { ConfigRepo } from '../../repos/config'
import { Spinner } from '../../uis/spinner'
import { Cmd } from '../interface'
import { AddConfigOpts } from './opts'

export class ConfigCmd implements Cmd {
  private cmd: Command
  private configRepo: ConfigRepo
  private spinner: Spinner

  constructor(configRepo: ConfigRepo, spinner: Spinner) {
    this.configRepo = configRepo
    this.spinner = spinner

    this.cmd = new Command('config')
    this.cmd.description('Add/remove/list configurations')

    this.cmd
      .command('add')
      .requiredOption('-k, --key <key> Key of the adding config')
      .requiredOption('-v, --value <value> Value of the adding config')
      .action(async (options: AddConfigOpts) => {
        this.spinner.start(`Adding ${options.key} config`)
        await this.configRepo.addConfigs([
          {
            key: options.key,
            value: options.value,
          },
        ])
        this.spinner.succeed(`${options.key} has been added`)
      })

    this.cmd.command('list').action(async () => {
      const configs = await this.configRepo.getAllConfigs()
      console.table(
        configs.map((c) => ({
          key: c.key,
          value: c.value,
        })),
      )
    })
  }

  public getCmdInstance(): Command {
    return this.cmd
  }
}
