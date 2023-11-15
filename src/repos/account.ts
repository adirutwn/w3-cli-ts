import { AceBase } from 'acebase'
import { Account } from '../entities/account'

export class AccountRepo {
  private store: AceBase
  private node = 'global/accounts'

  constructor(_store: AceBase) {
    this.store = _store
  }

  async count(): Promise<number> {
    return await this.store.ref(this.node).count()
  }

  async getAllAccounts(): Promise<Array<Account>> {
    const accounts = (await this.store.ref(this.node).get()).val()
    return accounts
  }

  async getAccountByIndex(index: number): Promise<Account> {
    const accounts = await this.getAllAccounts()
    return accounts[index]
  }

  async getAccountByLabel(label: string): Promise<Account> {
    const matchedAccounts = await this.store.ref(this.node).query().filter('label', '==', label).get()
    if (matchedAccounts.length == 0) {
      throw new Error(`Account with label ${label} not found`)
    }
    const val = matchedAccounts[0].val()
    if (val == null) {
      throw new Error(`Account with label ${label} not found`)
    }
    return val
  }

  async addAccounts(accounts: Array<Account>) {
    const addedAccounts = await this.getAllAccounts()
    if (addedAccounts != null) {
      for (const newAccount of accounts) {
        const found = addedAccounts.find((account) => account.label == newAccount.label)
        if (found) {
          throw new Error(`Account with label ${newAccount.label} already exists`)
        }
      }
    }

    await this.store.ref(this.node).set(addedAccounts.concat(accounts))
  }
}
