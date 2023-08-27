import { AceBase } from 'acebase'
import { BaseConfig } from '../entities/config'

export class ConfigRepo {
  private store: AceBase
  private node = 'global/configs'

  constructor(_store: AceBase) {
    this.store = _store
  }

  async count(): Promise<number> {
    return await this.store.ref(this.node).count()
  }

  async getAllConfigs(): Promise<Array<BaseConfig>> {
    const configs = (await this.store.ref(this.node).get()).val()
    return configs
  }

  async getConfigByIndex(index: number): Promise<BaseConfig> {
    const accounts = await this.getAllConfigs()
    return accounts[index]
  }

  async getConfigByKey(key: string): Promise<BaseConfig> {
    const matchedConfig = await this.store.ref(this.node).query().filter('key', '==', key).get()
    if (matchedConfig.length == 0) {
      throw new Error(`Config with key ${key} not found`)
    }
    const val = matchedConfig[0].val()
    if (val == null) {
      throw new Error(`Config with key ${key} not found`)
    }
    return val
  }

  async addConfigs(newConfigs: Array<BaseConfig>) {
    const addedConfigs = await this.getAllConfigs()
    if (addedConfigs != null) {
      for (const newConfig of newConfigs) {
        const found = addedConfigs.find((config) => config.key == newConfig.key)
        if (found) {
          throw new Error(`Config with key ${newConfig.key} already exists`)
        }
      }
    }

    await this.store.ref(this.node).set(newConfigs)
  }
}
