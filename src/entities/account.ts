export interface BaseAccount {
  address: string
  key: string
}

export interface Account extends BaseAccount {
  label: string
}
