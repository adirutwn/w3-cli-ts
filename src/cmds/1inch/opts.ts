export interface TwapOpts {
  chainId: number
  fromToken: string
  toToken: string
  amount: number
  triggerPrice: number
  signer: string
}
