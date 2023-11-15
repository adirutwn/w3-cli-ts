import axios from 'axios'
import { BigNumber, BigNumberish, ethers, Overrides, providers, Signer } from 'ethers'
import { OneInchSpender, OneInchSwap } from './interface'
import { SwapResult } from './interface'
import { MulticallWrapper } from '../MulticallWrapper'
import { sleep } from '../../utils/time'
import { equalIgnoreCase } from '../../utils/string'
import { abi as Erc20Abi } from '../../abis/ERC20.json'

export class OneInchWrapper {
  private oneInchApiUrl: string
  private chainId: number
  private signer: Signer
  private multiCallService: MulticallWrapper
  private protocols: Array<string>
  private oneInchApiKey: string

  constructor(
    _oneInchApiUrl: string,
    _chainId: number,
    _multiCallService: MulticallWrapper,
    _signer: Signer,
    _protocols: Array<string>,
    _oneInchApiKey: string,
  ) {
    this.oneInchApiUrl = _oneInchApiUrl
    this.signer = _signer
    this.chainId = _chainId
    this.multiCallService = _multiCallService
    this.protocols = _protocols
    this.oneInchApiKey = _oneInchApiKey
  }

  async spender(): Promise<OneInchSpender> {
    const raw = await axios.get(`${this.oneInchApiUrl}/${this.chainId}/approve/spender`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.oneInchApiKey}`,
      },
    })
    return raw.data
  }

  async swapExactTokensForTokens(
    fromTokenAddress: string,
    toTokenAddress: string,
    path: string[],
    amountWei: BigNumberish,
    slippageBps: BigNumberish,
    confirmation: number = 3,
    overrides?: Overrides,
  ): Promise<[SwapResult, number]> {
    const fromToken = new ethers.Contract(fromTokenAddress, Erc20Abi, this.signer)
    const toToken = new ethers.Contract(toTokenAddress, Erc20Abi, this.signer)
    const signerAddress = await this.signer.getAddress()
    const amountWeiBN = ethers.BigNumber.from(amountWei)

    let nonce = await this.signer.getTransactionCount()
    if (overrides && overrides.nonce) {
      nonce = overrides.nonce as number
    }

    console.log('-------------')
    console.log('> Getting 1inch router address...')
    const oneInchSpender = await this.spender()
    console.log('> Delay 1.5 secs...')
    await sleep(1500)

    console.log('> Loading all tokens info...')
    const [fromTokenSymbol, fromTokenDecimals, fromTokenAllowance, toTokenSymbol, toTokenDecimals, toBefore] =
      await this.multiCallService.multiContractCall<[string, BigNumber, BigNumber, string, BigNumber, BigNumber]>([
        {
          contract: fromToken,
          function: 'symbol',
        },
        {
          contract: fromToken,
          function: 'decimals',
        },
        {
          contract: fromToken,
          function: 'allowance',
          params: [signerAddress, oneInchSpender.address],
        },
        {
          contract: toToken,
          function: 'symbol',
        },
        {
          contract: toToken,
          function: 'decimals',
        },
        {
          contract: toToken,
          function: 'balanceOf',
          params: [signerAddress],
        },
      ])
    console.log('> Done.')

    console.log(`> ${ethers.utils.formatUnits(amountWei, fromTokenDecimals)} ${fromTokenSymbol} -> ${toTokenSymbol}`)

    if (equalIgnoreCase(fromTokenAddress, toTokenAddress)) {
      console.log('> Same asset. No need swap.')
      return [
        {
          txHash: 'Same asset. No need swap',
          fromTokenSymbol,
          fromTokenDecimals,
          fromTokenAmount: amountWeiBN,
          toTokenSymbol,
          toTokenDecimals,
          toTokenAmount: 0,
        },
        nonce,
      ]
    }

    if (amountWeiBN.eq(0)) {
      console.log('> 0 balance. No need swap.')
      return [
        {
          txHash: '0 balance. No need swap',
          fromTokenSymbol,
          fromTokenDecimals,
          fromTokenAmount: amountWeiBN,
          toTokenSymbol,
          toTokenDecimals,
          toTokenAmount: 0,
        },
        nonce,
      ]
    }

    console.log('> Check if one inch swap contract has allowance')
    if (fromTokenAllowance.lt(amountWei)) {
      console.log('> Approve one inch swap contract')
      let gasPrice = undefined
      if (this.chainId === 56) {
        // If BSC, force gas to be 3.5 gwei
        gasPrice = ethers.utils.parseUnits('3.5', 'gwei')
      }
      const approveTx = await fromToken.approve(oneInchSpender.address, ethers.constants.MaxUint256, {
        nonce: nonce++,
        gasPrice,
      })
      await approveTx.wait(confirmation)
    }
    console.log('> Allowance ok')

    console.log('> Finding best price swap path through 1inch...')
    const oneInchData = (
      await axios.get(`${this.oneInchApiUrl}/${this.chainId}/swap`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.oneInchApiKey}`,
        },
        params: {
          fromTokenAddress,
          toTokenAddress,
          amount: amountWeiBN.toString(),
          fromAddress: signerAddress,
          slippage: ethers.utils.formatUnits(slippageBps, 2),
          protocols: this.protocols.length > 0 ? this.protocols.join(',') : null,
        },
      })
    ).data as OneInchSwap
    console.log('> Delay 1.5 secs...')
    await sleep(1500)

    const tx: providers.TransactionRequest = {
      from: oneInchData.tx.from,
      to: oneInchData.tx.to,
      data: oneInchData.tx.data,
      gasLimit: oneInchData.tx.gas,
      gasPrice: parseInt(oneInchData.tx.gasPrice),
      nonce: nonce++,
    }
    const swapTx = await this.signer.sendTransaction(tx)
    console.log('> Sent swap transaction successfully')
    console.log(`> Waiting for ${confirmation} confirmation...`)
    const swapTxReceipt = await swapTx.wait(confirmation)
    let toAfter = await toToken.balanceOf(signerAddress)

    if (swapTxReceipt.status === 1) {
      console.log('> ✅ Swap successfully')
      let receivedAmount = toAfter.sub(toBefore)
      console.log('> ⛓ Tx hash:', swapTx.hash)
      // Recalculate received amount if receivedAmount is less than 0
      // as receivedAmount should always be greater than 0
      while (receivedAmount.lt(0)) {
        console.log(`> ⚠️ Received amount is less than 0. Retry...`)
        console.log(`> ${toBefore} -> ${toAfter}`)
        toAfter = await toToken.balanceOf(signerAddress)
        receivedAmount = toAfter.sub(toBefore)
        if (receivedAmount.lt(0)) {
          console.log('> ⏳ Waiting for 1 second to recalculate received amount')
          sleep(1000)
        }
      }
      console.log(
        `> ${ethers.utils.formatUnits(amountWei, fromTokenDecimals)} ${fromTokenSymbol} -> ${ethers.utils.formatUnits(
          receivedAmount,
          toTokenDecimals,
        )} ${toTokenSymbol}`,
      )
      return [
        {
          txHash: swapTx.hash,
          fromTokenSymbol,
          fromTokenDecimals,
          fromTokenAmount: amountWeiBN,
          toTokenSymbol,
          toTokenDecimals,
          toTokenAmount: receivedAmount,
        },
        nonce,
      ]
    }

    throw new Error('Swap failed')
  }

  async getSwapData(
    fromTokenAddress: string,
    toTokenAddress: string,
    amount: string,
    fromAddress: string,
    toAddress: string,
    slippage: number,
  ) {
    const oneInchData = (
      await axios.get(`${this.oneInchApiUrl}/${this.chainId}/swap`, {
        params: {
          fromTokenAddress,
          toTokenAddress,
          amount: amount.toString(),
          fromAddress: fromAddress,
          toAddress: toAddress,
          slippage: slippage.toString(),
          disableEstimate: 'true', // skip
        },
      })
    ).data as OneInchSwap

    return oneInchData
  }
}
