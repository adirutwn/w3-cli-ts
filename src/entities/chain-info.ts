import { ethers } from 'ethers'

export type ChainEntity = {
  name: string
  rpcUrl: string
  jsonRpcProvider: ethers.providers.JsonRpcProvider
  nativeSymbol: string
}

export default {
  1: {
    name: 'mainnet',
    rpcUrl: 'https://eth.llamarpc.com',
    jsonRpcProvider: new ethers.providers.JsonRpcProvider('https://eth.llamarpc.com'),
    nativeSymbol: 'ETH',
  },
  42161: {
    name: 'arbitrum',
    rpcUrl: 'https://arbitrum-one.publicnode.com',
    jsonRpcProvider: new ethers.providers.JsonRpcProvider('https://arbitrum-one.publicnode.com'),
    nativeSymbol: 'ETH',
  },
  421613: {
    name: 'arbitrum_goerli',
    rpcUrl: 'https://arbitrum-goerli.publicnode.com',
    jsonRpcProvider: new ethers.providers.JsonRpcProvider('https://arbitrum-goerli.publicnode.com'),
    nativeSymbol: 'ETH',
  },
} as { [chainId: number]: ChainEntity }
