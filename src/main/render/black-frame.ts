import { app } from 'electron'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathExists } from '../fs'

const BLACK_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)

export async function getBlackFramePath(): Promise<string> {
  const directory = path.join(app.getPath('userData'), 'render')
  const filePath = path.join(directory, 'black-frame.png')

  if (!(await pathExists(filePath))) {
    await mkdir(directory, { recursive: true })
    await writeFile(filePath, BLACK_PNG)
  }

  return filePath
}
