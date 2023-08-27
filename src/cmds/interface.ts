import { Command } from 'commander'

export interface Cmd {
  getCmdInstance(): Command
}
