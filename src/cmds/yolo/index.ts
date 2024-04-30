import { Command } from 'commander'
import { Cmd } from '../interface'
import { AccountRepo } from '../../repos/account'
import { ConfigRepo } from '../../repos/config'
import { Spinner } from '../../uis/spinner'
import { FarmMoonOpts } from './opts'
import chainInfo from '../../entities/chain-info'
import { ethers } from 'ethers'
import { abi as MoonOrDoomAbi } from '../../abis/MoonOrDoom.json'
import { sleep } from '../../utils/time'

export class YoloCmd implements Cmd {
  private cmd: Command
  private accountRepo: AccountRepo
  private configRepo: ConfigRepo
  private spinner: Spinner

  constructor(accountRepo: AccountRepo, configRepo: ConfigRepo, spinner: Spinner) {
    this.accountRepo = accountRepo
    this.configRepo = configRepo
    this.spinner = spinner

    this.cmd = new Command('yolo')
    this.cmd.description('Farm yolo games')

    this.cmd
      .command('farm-moon')
      .requiredOption('-a, --amount <amount>', 'The amount to swap', parseFloat)
      .requiredOption('-ms, --moon-signer <moonSignerLabel>', 'Signer to enter a round as Moon')
      .requiredOption('-ds, --doom-signer <doomSignerLabel>', 'Signer to enter a round as Doom')
      .action(async (opts: FarmMoonOpts) => {
        const chain = chainInfo[81457]
        const moonSigner = new ethers.Wallet(
          (await this.accountRepo.getAccountByLabel(opts.moonSigner)).key,
          chain.jsonRpcProvider,
        )
        const moonSignerAddress = await moonSigner.getAddress()

        const doomSigner = new ethers.Wallet(
          (await this.accountRepo.getAccountByLabel(opts.doomSigner)).key,
          chain.jsonRpcProvider,
        )
        const doomSignerAddress = await doomSigner.getAddress()

        console.log(`> Moon Signer: ${moonSignerAddress}`)
        console.log(`> Doom Signer: ${doomSignerAddress}`)

        const moonOrDoomAsMoonSigner = new ethers.Contract(
          '0x693B37a9859Ce9465Fb2aAdeB03811a26A0c37C0',
          MoonOrDoomAbi,
          moonSigner,
        )
        const moonOrDoomAsDoomSigner = new ethers.Contract(
          '0x693B37a9859Ce9465Fb2aAdeB03811a26A0c37C0',
          MoonOrDoomAbi,
          doomSigner,
        )

        let currentEpoch = ethers.BigNumber.from(0)
        let lastEnteredRound = ethers.BigNumber.from(0)
        let enteredRounds = []

        // Farming yolo moon/doom
        console.log(`> Farming yolo moon/doom...`)
        while (1) {
          try {
            currentEpoch = await moonOrDoomAsMoonSigner.currentEpoch()

            console.log(`> ℹ️ Epoch: ${currentEpoch}`)
            console.log(`> ℹ️ Last entered round: ${lastEnteredRound}`)
            const blockInfo = await chain.jsonRpcProvider.getBlock('latest')
            const roundInfo = await moonOrDoomAsMoonSigner.rounds(currentEpoch)

            if (
              this.enterable(
                blockInfo.timestamp,
                roundInfo.startTimestamp.toNumber(),
                roundInfo.lockTimestamp.toNumber(),
              ) &&
              !currentEpoch.eq(lastEnteredRound)
            ) {
              if (!lastEnteredRound.eq(0)) {
                console.log(`> Operator starts a new round, claiming rewards of all closed round...`)
                const closedRound = []
                for (const r of enteredRounds) {
                  const roundInfo = await moonOrDoomAsMoonSigner.rounds(r)
                  if (blockInfo.timestamp > roundInfo.closeTimestamp.toNumber()) {
                    closedRound.push(r)
                  }
                }

                if (closedRound.length > 0) {
                  console.log(`> Closed rounds: ${closedRound.join(', ')}`)
                } else {
                  console.log(`> Not found any closed round`)
                }

                if (closedRound.length != 0) {
                  const moonClaimableRound = []
                  const doomClaimableRound = []
                  for (const r of closedRound) {
                    if (await moonOrDoomAsMoonSigner.claimable(r, moonSignerAddress)) {
                      moonClaimableRound.push(r)
                    }
                    if (await moonOrDoomAsDoomSigner.claimable(r, doomSignerAddress)) {
                      doomClaimableRound.push(r)
                    }
                  }

                  if (moonClaimableRound.length != 0) {
                    console.log(`> Claiming Moon's rewards for rounds [${moonClaimableRound.join(', ')}]...`)
                    await moonOrDoomAsMoonSigner.claim(moonClaimableRound)
                  }

                  if (doomClaimableRound.length != 0) {
                    console.log(`> Claiming rewards for Doom...`)
                    await moonOrDoomAsDoomSigner.claim(doomClaimableRound)
                  }

                  for (const r of closedRound) {
                    const indexClosedRound = enteredRounds.indexOf(r)
                    if (indexClosedRound > -1) {
                      enteredRounds.splice(indexClosedRound, 1)
                      console.log(`> Removed ${r} from enteredRounds as we claimed rewards`)
                      console.log(`> Lastest entered rounds: [${enteredRounds.join(', ')}]`)
                    }
                  }
                }
              }

              console.log(`> Round ${currentEpoch} is enterable and we not entered yet`)
              console.log(`> Entering round ${currentEpoch} as Moon and Doom...`)
              console.log(`> Sleep 1.5 seconds to make sure nonce is ok`)
              await sleep(1.5 * 1000)
              const txs = await Promise.all([
                moonOrDoomAsMoonSigner.enterMoon(currentEpoch, {
                  value: ethers.utils.parseEther(opts.amount.toString()),
                }),
                moonOrDoomAsDoomSigner.enterDoom(currentEpoch, {
                  value: ethers.utils.parseEther(opts.amount.toString()),
                }),
              ])
              console.log(`> Enter Moon Tx: ${txs[0].hash}`)
              console.log(`> Enter Doom Tx: ${txs[1].hash}`)

              lastEnteredRound = currentEpoch
              enteredRounds.push(currentEpoch)
              console.log(`> 🟢 Done`)
              continue
            } else {
              console.log(`> ⏰ Entered the round. Waiting for the result..`)
            }
          } catch (e) {
            console.log(`> 🔴 Something wrong!`)
            console.error(e)
            console.log(`> 🟡 Retry in the next execution`)
          }
          await sleep(10 * 1000)
        }
      })
  }

  enterable(blockTimestamp: number, roundStartTimestamp: number, roundLockTimestamp: number): boolean {
    return (
      roundStartTimestamp != 0 &&
      roundLockTimestamp != 0 &&
      blockTimestamp > roundStartTimestamp &&
      blockTimestamp < roundLockTimestamp
    )
  }

  public getCmdInstance(): Command {
    return this.cmd
  }
}
