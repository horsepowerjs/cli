import { Command, CmdArguments } from '../Command'
import * as path from 'path'
import * as cp from 'child_process'
import * as fs from 'fs'
import * as os from 'os'
import * as mkdirp from 'mkdirp'
import * as dotenv from 'dotenv'
import { isHorsepowerProject, notAProject } from '../../helper'
import { error } from '../..'
import ServerStopCommand from './stop';
import ServerStartCommand from './start';

interface ServerRestartOptions {
  path?: string
}

export default class ServerRestartCommand extends Command {
  public name: string = 'server:restart'
  public description: string = 'Restarts a server that handles requests for an application'
  public options: CmdArguments[] = [
    { name: 'path', defaultOption: true, description: 'An optional path to a server to be restarted' }
  ]

  public static async restart(options: ServerRestartOptions) {
    await ServerStopCommand.stop(options)
    await ServerStartCommand.start(options)
  }

  public async fire(options: ServerRestartOptions) {
    ServerRestartCommand.restart(options)
  }
}