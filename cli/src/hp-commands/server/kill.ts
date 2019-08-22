import { Command, CmdArguments } from '../Command'
import * as path from 'path'
import * as fs from 'fs'
import ServerListCommand, { Server } from './list';

interface ServerKillOptions {
  id?: number
}

export default class ServerKillCommand extends Command {
  public name: string = 'server:kill'
  public description: string = 'Kills one or all servers'
  public options: CmdArguments[] = [
    { name: 'id', defaultOption: true, type: Number, description: 'Kills a server by server id' }
  ]

  public async fire(options: ServerKillOptions) {
    let serversPath = path.join(__dirname, '../../servers.json')
    let servers: Server[] = []
    if (fs.existsSync(serversPath)) servers = await import(serversPath)

    if (options.id) {
      let server = servers.find(i => i.id == options.id)
      if (server) {
        ServerListCommand.removeServer(server.pid)
      }
    } else {
      for (let server of servers) {
        ServerListCommand.removeServer(server.pid)
      }
    }
  }

}