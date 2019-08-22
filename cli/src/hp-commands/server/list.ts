import { Command, CmdArguments } from '../Command'
import * as path from 'path'
import * as fs from 'fs'
import * as dotenv from 'dotenv'
import ServerStopCommand from './stop';

export interface Server {
  name: string
  pid: number
  port: number
  mode: string
  root: string
  id: number
}

export default class ServerListCommand extends Command {
  public name: string = 'server:list'
  public description: string = 'A list of all running servers'
  public options: CmdArguments[] = []

  private longestId: number = 0
  private longestName: number = 0
  private longestMode: number = 0
  private longestPort: number = 0
  private longestPID: number = 0

  private static log(val: any) {
    fs.writeFileSync(path.join(process.cwd(), 'debug.log'), typeof val == 'string' ? val : JSON.stringify(val, null, 2))
  }

  public static async addServer(root: string, pid: number) {
    let serversPath = path.join(__dirname, '../../servers.json')
    let env = dotenv.parse(fs.readFileSync(path.join(root, '.env')))
    let servers: Server[] = []
    if (fs.existsSync(serversPath)) servers = await import(serversPath)
    let serverIdx = servers.findIndex(i => i.name == (env.APP_NAME || ''))
    let maxId = servers.reduce((acc, val) => val.id > acc ? val.id : acc, -1)
    let vals: Server = {
      name: env.APP_NAME,
      mode: env.APP_ENV,
      port: Number(env.APP_PORT),
      pid,
      root: root,
      id: -1
    }

    // Set the next id or leave the current one alone
    serverIdx == -1 ? (vals.id = maxId + 1) : (vals.id = servers[serverIdx].id)

    // Add a new server or update the existing one
    serverIdx == -1 ? servers.push(vals) : (servers[serverIdx] = vals)

    fs.writeFileSync(serversPath, JSON.stringify(servers, null, 2))
  }

  public static async removeServer(pid: number) {
    let serversPath = path.join(__dirname, '../../servers.json')
    if (fs.existsSync(serversPath)) {
      let servers: Server[] = await import(serversPath)
      let serverIdx = servers.findIndex(i => i.pid == pid)
      serverIdx > -1 && ServerStopCommand.stop({ path: servers[serverIdx].root }, true)
      serverIdx > -1 && servers.splice(serverIdx, 1)
      fs.writeFileSync(serversPath, JSON.stringify(servers, null, 2))
    }
  }

  public async fire() {
    let serversPath = path.join(__dirname, '../../servers.json')
    let servers: Server[] = []
    if (fs.existsSync(serversPath)) servers = await import(serversPath)

    // Get the longest value for each column
    this.longestName = servers.reduce((acc, val) => val.name.length > acc ? val.name.length : acc, 0)
    this.longestMode = servers.reduce((acc, val) => val.mode.length > acc ? val.mode.length : acc, 0)
    this.longestPort = servers.reduce((acc, val) => val.port.toString().length > acc ? val.port.toString().length : acc, 0)
    this.longestPID = servers.reduce((acc, val) => val.pid.toString().length > acc ? val.pid.toString().length : acc, 0)

    // Make sure the header value is included in the longest value for each column
    this.longestId = 'ID'.length > this.longestId ? 'Name'.length : this.longestId
    this.longestName = 'Name'.length > this.longestName ? 'Name'.length : this.longestName
    this.longestMode = 'Mode'.length > this.longestMode ? 'Mode'.length : this.longestMode
    this.longestPort = 'Port'.length > this.longestPort ? 'Port'.length : this.longestPort
    this.longestPID = 'PID'.length > this.longestPID ? 'PID'.length : this.longestPID

    // Display the header items with horizontal lines
    this.header()

    let listedServers = 0
    for (let server of servers) {
      try {
        process.kill(server.pid, 0)
        console.log(`| ${server.id.toString().padEnd(this.longestId)} | ${server.name.padEnd(this.longestName)} | ${server.mode.padEnd(this.longestMode)} | ${server.port.toString().padEnd(this.longestPort)} | ${server.pid.toString().padEnd(this.longestPID)} |`)
        listedServers++
      } catch (e) {
        // The process was not found, so remove the server from the list of servers
        ServerListCommand.removeServer(server.pid)
      }
    }

    // No servers are listed in the servers file or one or more servers were
    // removed in the above loop due to the process not being found
    if (servers.length == 0 || (listedServers == 0 && servers.length > 0)) this.noServersMsg()

    this.hr()
  }

  private header() {
    this.hr()
    console.log(`| ${'ID'.padEnd(this.longestId)} | ${'Name'.padEnd(this.longestName)} | ${'Mode'.padEnd(this.longestMode)} | ${'Port'.padEnd(this.longestPort)} | ${'PID'.padEnd(this.longestPID)} |`)
    this.hr()
  }

  private hr() {
    console.log(`+${''.padEnd(this.longestId + 2, '-')}+${''.padEnd(this.longestName + 2, '-')}+${''.padEnd(this.longestMode + 2, '-')}+${''.padEnd(this.longestPort + 2, '-')}+${''.padEnd(this.longestPID + 2, '-')}+`)
  }

  private noServersMsg() {
    console.log(`| ${'No servers are running'.padEnd(
      this.longestId + this.longestName + this.longestMode + this.longestPort + this.longestPID + 12
    )} |`)
  }
}