import { Command, CmdArguments } from '../Command'
import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'
import { isRed5Project, notAProject } from '../../helper'
import { warning } from '../..'
import ServerListCommand from './list';

interface ServerStopOptions {
  path?: string
}

export default class ServerStopCommand extends Command {
  public name: string = 'server:stop'
  public description: string = 'Stops a server that handles requests for an application'
  public options: CmdArguments[] = [
    { name: 'path', defaultOption: true, description: 'An optional path to a server to be stopped' }
  ]

  public static async stop(options: ServerStopOptions, silent: boolean = false) {
    let pid
    let dir = options.path ? path.resolve(process.cwd(), options.path) : process.cwd()
    if (!await isRed5Project(dir)) return notAProject()
    let red5json = await import(path.join(dir, 'red5.json'))
    if (red5json.server && red5json.server.pid) {
      pid = red5json.server.pid
      delete red5json.server.pid
      !silent && console.log(`Stopping server with a process id of "${pid}"`)
      try {
        os.platform() == 'win32' ? process.kill(pid) : process.kill(-pid)
      } catch (e) {
        !silent && console.log(warning('Server process was not found, so it must have been stopped manually. Thats okay, no action is needed.'))
      }
      ServerListCommand.removeServer(pid)
    } else {
      !silent && console.log(warning('There is no process id set for this project.'))
    }
    fs.writeFile(path.join(dir, 'red5.json'), JSON.stringify(red5json, null, 2), () => { })
    fs.truncate(path.join(dir, 'storage/framework/logs/server.log'), () => { })
  }

  public async fire(options: ServerStopOptions) {
    ServerStopCommand.stop(options)
  }

}