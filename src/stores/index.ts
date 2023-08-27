import acebase, { AceBase, AceBaseLocalSettings } from 'acebase'
import { ensureDirectoryExistence } from '../utils/file'
import os from 'os'
import path from 'path'

const storePath = path.join(os.homedir(), '.w3-cli', 'store')

// Make sure store directory exists
ensureDirectoryExistence(path.join(storePath, 'ballpark.json'))
const storeConfig: Partial<AceBaseLocalSettings> = {
  logLevel: 'error',
  storage: { path: storePath },
  sponsor: true,
}
export const store = new AceBase('w3-cli-store', storeConfig)
