import * as path from 'path'
import * as fs from 'fs'
import { error, PATH, RESOURCES, isFile, replaceTemplateVars } from '../..'
import { Command, CmdArguments } from '../Command'
import * as mkdirp from 'mkdirp'
import ListCommands from '../list';

interface CommandMakeOptions {
  name: string
  api: boolean
  resource: boolean
}

export default class extends Command {

  public name: string = 'command:make'
  public description: string = 'Makes a new Command line command'
  public options: CmdArguments[] = [
    { name: 'name', defaultOption: true }
  ]

  public async fire(options: CommandMakeOptions) {

    // This is the root location of the commands
    const COMMANDS_ROOT = 'app/commands'

    // Get the name of the command
    let [command_group, command_name] = options.name.split(':').map(i => i.trim())

    if (!command_name) {
      command_name = command_group
      command_group = ''
    }

    return new Promise<void>(async resolve => {

      let cmd = await ListCommands.getCommand(command_group, command_name)

      if (cmd) {
        if (cmd.builtin) console.log(error(`"${options.name}" is a builtin command that cannot be overwritten.`))
        else console.log(error(`"${options.name}" already exists.`))
        return resolve()
      }

      let commandPath = path.join(PATH, COMMANDS_ROOT, command_group, command_name + '.js')

      mkdirp.sync(path.join(PATH, COMMANDS_ROOT, command_group))

      // Copy the template from the resources folder
      fs.createReadStream(path.join(RESOURCES, 'templates/command/command.tpl'))
        .pipe(fs.createWriteStream(commandPath))
        .on('close', () => {
          let contents = fs.readFileSync(commandPath).toString()
          fs.writeFileSync(commandPath, replaceTemplateVars(contents, [['name', options.name]]))
          resolve()
        })
    })
  }
}