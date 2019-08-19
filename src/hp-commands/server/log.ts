import { Command, CmdArguments } from '../Command'
import * as path from 'path'
import * as cp from 'child_process'
import * as fs from 'fs'
import { isHorsepowerProject, notAProject } from '../../helper'
import { error } from '../..';

interface ServerLogOptions {
  path?: string
}

export default class ServerLogCommand extends Command {
  public name: string = 'server:log'
  public description: string = 'Shows the output of a server log in real time'
  public options: CmdArguments[] = [
    { name: 'path', defaultOption: true, description: 'The path to a horsepower project to watch' }
  ]

  public async fire(options: ServerLogOptions) {
    let dir = options.path ? path.resolve(process.cwd(), options.path) : process.cwd()
    if (!await isHorsepowerProject(dir)) return notAProject()
    try {
      let log = path.join(dir, 'storage/framework/logs/server.log')
      if (!fs.existsSync(log)) fs.openSync(log, 'w')
      console.log('Reading log file:', log)
      let watch = cp.spawn('tail', ['-f', log], { windowsHide: true })

      watch.stdout && watch.stdout.on('data', chunk => process.stdout.write(chunk))
      watch.stdout && watch.stderr.on('data', chunk => process.stdout.write(chunk))
    } catch (e) {
      console.log(error(e.message))
    }
  }
}