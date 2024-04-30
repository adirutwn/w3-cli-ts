#! /usr/bin/env node

import { Command } from 'commander'
import packageJson from '../package.json'
import { Spinner } from './uis/spinner'
import { store } from './stores'
import { AccountRepo } from './repos/account'
import { AccountCmd } from './cmds/account'
import { ConfigRepo } from './repos/config'
import { ConfigCmd } from './cmds/config'
import { OneInchCmd } from './cmds/1inch'
import { Erc20Cmd } from './cmds/erc20'
import { NativeCmd } from './cmds/native'
import { ChainCmd } from './cmds/chain'
import { YoloCmd } from './cmds/yolo'

const program = new Command()
program.description('A CLI for interacting with Web3 protocols')
program.version(packageJson.version)

const spinner = new Spinner()

// Bootstrap repos
const accountRepo = new AccountRepo(store)
const configRepo = new ConfigRepo(store)

// Bootstrap account command
const accountCmd = new AccountCmd(accountRepo, spinner)
const configCmd = new ConfigCmd(configRepo, spinner)
const oneInchCmd = new OneInchCmd(accountRepo, configRepo, spinner)
const erc20Cmd = new Erc20Cmd(accountRepo, spinner)
const nativeCmd = new NativeCmd(accountRepo, spinner)
const chainCmd = new ChainCmd(spinner)
const yoloCmd = new YoloCmd(accountRepo, configRepo, spinner)

program.addCommand(accountCmd.getCmdInstance())
program.addCommand(configCmd.getCmdInstance())
program.addCommand(oneInchCmd.getCmdInstance())
program.addCommand(erc20Cmd.getCmdInstance())
program.addCommand(nativeCmd.getCmdInstance())
program.addCommand(chainCmd.getCmdInstance())
program.addCommand(yoloCmd.getCmdInstance())

async function main() {
  await store.ready()
  await program.parseAsync()
  await store.close()
}

main()

process.on('unhandledRejection', (error) => {
  spinner.fail('Something went wrong')
  console.error(error)
})
