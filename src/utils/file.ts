import * as fs from 'fs'
import path from 'path'

export function ensureDirectoryExistence(filePath: string) {
  var dirname = path.dirname(filePath)
  if (fs.existsSync(dirname)) {
    return
  }
  ensureDirectoryExistence(dirname)
  fs.mkdirSync(dirname)
}

export function saveToFile(csv: string, filePath: string) {
  fs.writeFile(filePath, csv, 'utf8', (err) => {
    if (err) {
      console.error(err)
    }
  })
}
