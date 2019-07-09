import { Command, CmdArguments } from '../Command'
import * as path from 'path'
import * as cp from 'child_process'
import * as fs from 'fs'
import * as os from 'os'
import * as mkdirp from 'mkdirp'
import * as dotenv from 'dotenv'
import { isRed5Project, notAProject } from '../../helper'
import { error } from '../..'

interface ServerStartOptions {
  path?: string
}

export default class StartServerCommand extends Command {
  public name: string = 'server:start'
  public description: string = 'Starts a server that handles requests for an application'
  public options: CmdArguments[] = [
    { name: 'path', defaultOption: true, description: 'An optional path to a server to be started' }
  ]

  public static async start(options: ServerStartOptions) {
    let dir = options.path ? path.resolve(process.cwd(), options.path) : process.cwd()
    dotenv.config({ path: path.join(dir, '.env') })
    const isProd = ['prod', 'production'].includes(process.env.APP_ENV || 'prod')
    if (!await isRed5Project(dir)) return notAProject()
    try {
      let red5json = await import(path.join(dir, 'red5.json'))
      if (!red5json.server) red5json.server = {}
      if (red5json.server.pid && red5json.server.pid > 0) {
        // Attempt to kill the process
        // If start gets called when a process is already running we need to kill it
        // otherwise there will be multiple servers running which can cause issues
        try {
          let pid = red5json.server.pid
          os.platform() == 'win32' ? process.kill(pid) : process.kill(-pid)
        } catch (e) {
          console.log(error(e.message))
        }
      }
      let out: any = 'ignore'
      let err: any = 'ignore'
      if (!isProd) {
        let logs = path.join(dir, 'storage/framework/logs')
        mkdirp.sync(logs)
        out = fs.openSync(path.join(logs, 'server.log'), 'a')
        err = fs.openSync(path.join(logs, 'server.log'), 'a')
      }
      try {
        let child = cp.spawn('node', [path.join(__dirname, '../../server'), dir], { detached: true, stdio: ['ignore', out, err, 'ignore'] })

        red5json.server.pid = child.pid
        fs.writeFile(path.join(dir, 'red5.json'), JSON.stringify(red5json, null, 2), () => { })

        child.unref()
        console.log(`Server started with a process id of "${child.pid}"`)
      } catch (e) {
        console.log(error('Could not start the server:', e.message))
      }
    } catch (e) {
      if (e.code == 'MODULE_NOT_FOUND') {
        console.log(error('This is not a red5 project, add a path to a project containing a "red5.json" file.'))
      } else {
        console.log(error(e.message))
      }
    }
  }

  public async fire(options: ServerStartOptions) {
    StartServerCommand.start(options)
  }
}