import { ethers } from 'ethers'

export type OneInchToken = {
  symbol: string
  name: string
  decimals: string
  address: string
  logoURI: string
}

export type OneInchHop = {
  name: string
  part: number
  fromTokenAddress: string
  toTokenAddress: string
}

export type OneInchTx = {
  from: string
  to: string
  data: string
  value: string
  gasPrice: string
  gas: number
}

export type OneInchSwap = {
  fromToken: OneInchToken
  toToken: OneInchToken
  fromTokenAmount: string
  toTokenAmount: string
  protocols: Array<OneInchHop>
  tx: OneInchTx
}

export type OneInchSpender = {
  address: string
}

export interface SwapResult {
  txHash: string
  fromTokenSymbol: string
  fromTokenDecimals: ethers.BigNumberish
  fromTokenAmount: ethers.BigNumberish
  toTokenSymbol: string
  toTokenDecimals: ethers.BigNumberish
  toTokenAmount: ethers.BigNumberish
}
