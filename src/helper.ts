import * as fs from 'fs'
import * as path from 'path'
import { error } from '.'

export async function isHorsepowerProject(dir?: string) {
  const DIR = dir ? path.resolve(process.cwd(), dir) : process.cwd()
  const RED5_PATH = path.join(DIR, 'horsepower.json')
  return new Promise<boolean>(resolve => {
    try {
      fs.stat(RED5_PATH, async (err, stats) => {
        return resolve(err ? false : stats.isFile())
      })
    } catch (e) { return resolve(false) }
  })
}

export function notAProject() {
  console.log(error('This is not a horsepower project'))
  console.log('  -- Run "horsepower new <project-name>" to create a new project')
}