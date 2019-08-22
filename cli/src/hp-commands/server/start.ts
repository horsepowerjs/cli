import { Command, CmdArguments } from '../Command'
import * as path from 'path'
import * as cp from 'child_process'
import * as fs from 'fs'
import * as os from 'os'
import * as mkdirp from 'mkdirp'
import * as dotenv from 'dotenv'
import { isHorsepowerProject, notAProject } from '../../helper'
import { error } from '../..'

interface ServerStartOptions {
  path?: string
}

export default class ServerStartCommand extends Command {
  public name: string = 'server:start'
  public description: string = 'Starts a server that handles requests for an application'
  public options: CmdArguments[] = [
    { name: 'path', defaultOption: true, description: 'An optional path to a server to be started' }
  ]

  public static async start(options: ServerStartOptions) {
    let dir = options.path ? path.resolve(process.cwd(), options.path) : process.cwd()
    dotenv.config({ path: path.join(dir, '.env') })
    const isProd = ['prod', 'production'].includes(process.env.APP_ENV || 'prod')
    if (!await isHorsepowerProject(dir)) return notAProject()
    try {
      let horsepowerJson = await import(path.join(dir, 'horsepower.json'))
      if (!horsepowerJson.server) horsepowerJson.server = {}
      if (horsepowerJson.server.pid && horsepowerJson.server.pid > 0) {
        // Attempt to kill the process
        // If start gets called when a process is already running we need to kill it
        // otherwise there will be multiple servers running which can cause issues
        try {
          let pid = horsepowerJson.server.pid
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

        horsepowerJson.server.pid = child.pid
        fs.writeFile(path.join(dir, 'horsepower.json'), JSON.stringify(horsepowerJson, null, 2), () => { })

        child.unref()
        console.log(`Server started with a process id of "${child.pid}"`)
      } catch (e) {
        console.log(error('Could not start the server:', e.message))
      }
    } catch (e) {
      if (e.code == 'MODULE_NOT_FOUND') {
        console.log(error('This is not a horsepower project, add a path to a project containing a "horsepower.json" file.'))
      } else {
        console.log(error(e.message))
      }
    }
  }

  public async fire(options: ServerStartOptions) {
    ServerStartCommand.start(options)
  }
}