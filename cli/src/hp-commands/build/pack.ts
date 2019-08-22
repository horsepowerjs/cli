import { Command, CmdArguments } from '../Command'

interface ServerRestartOptions {
  path?: string
}

export default class BuildPackCommand extends Command {
  public name: string = 'build:pack'
  public description: string = 'Packs all of the assets'
  public options: CmdArguments[] = [
    { name: 'config', defaultOption: true, description: 'A configuration file that describes how to bundle the assets' }
  ]

  public static async pack(options: ServerRestartOptions) {

  }

  public async fire(options: ServerRestartOptions) {
    BuildPackCommand.pack(options)
  }
}