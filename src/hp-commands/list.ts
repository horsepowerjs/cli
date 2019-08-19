import { Command, CmdArguments } from './Command'
import * as glob from 'glob'
import * as path from 'path'
import { isHorsepowerProject } from '../helper';

export interface ItemInfo {
  name: string
  description: string
  options: CmdArguments[]
  commandName: string
  commandGroup: string
  builtin: boolean
  file: string
}

export default class ListCommands extends Command {
  public name: string = 'list'
  public description: string = 'Lists all of the supported commands'
  public options: CmdArguments[] = []

  public static async getCommands() {
    // Get all the commands
    let custom = path.join(process.cwd(), 'app/commands', '*/*.js')
    let customRoot = path.join(process.cwd(), 'app/commands', '*.js')
    let builtin = path.join(__dirname, '../hp-commands', '*/*.js')
    let builtinRoot = path.join(__dirname, '../hp-commands', '*.js')

    // Glob the command locations
    let globs = []
    globs.push(new Promise<string[]>(resolve => glob(custom, (err, matches) => resolve(matches))))
    globs.push(new Promise<string[]>(resolve => glob(customRoot, (err, matches) => resolve(matches))))
    globs.push(new Promise<string[]>(resolve => glob(builtin, (err, matches) => resolve(matches))))
    globs.push(new Promise<string[]>(resolve => glob(builtinRoot, (err, matches) => resolve(matches))))

    let files = []
    for (let f of await Promise.all(globs)) files.push(...f)

    let longest = 0

    // Get the information from each command
    let fileInfo: { [key: string]: ItemInfo[] } = files.map(file => {
      let cmd = require(file)
      let command: Command | null = null
      if (cmd && cmd.default) {
        command = new cmd.default()
      } else if (cmd) {
        try {
          command = new cmd()
        } catch (e) { }
      }

      // Build the results
      if (command) {
        longest = command.name.length > longest ? command.name.length : longest
        let [commandGroup, commandName] = command.name.split(':')
        return {
          name: command.name,
          description: command.description,
          options: command.options,
          commandName,
          commandGroup,
          builtin: file.includes('cli/hp-commands'),
          file
        } as ItemInfo
      }
      return {} as ItemInfo
    }).filter(i => i.name && i.name.length)
      .reduce((acc: { [key: string]: ItemInfo[] }, val) => {
        if (acc[val.commandGroup]) acc[val.commandGroup].push(val)
        else acc[val.commandGroup] = [val]
        return acc
      }, {})

    return { longest, fileInfo }
  }

  public static async getCommand(command_group: string, command_name: string) {
    let { fileInfo } = await ListCommands.getCommands()
    if (fileInfo[command_group]) {
      return fileInfo[command_group].find(i => i.commandName == command_name && i.commandGroup == command_group)
    }
  }

  public static async isCommand(command_group: string, command_name: string) {
    return !!(await this.getCommand(command_group, command_name))
  }


  public async fire() {
    let { longest, fileInfo } = await ListCommands.getCommands()

    let entries = Object.entries<ItemInfo[]>(fileInfo).sort((a, b) => a[0].localeCompare(b[0]))
    let isProject = await isHorsepowerProject()
    for (let group of entries) {
      // Only show the following if this is not a horsepower project
      if (!isProject && !group[1].find(i =>
        ['new', 'list'].includes(i.commandGroup) ||
        (['start', 'stop', 'log'].includes(i.commandName) && i.commandGroup == 'server')
      )) continue

      console.log(`\x1b[32m${group[0]}\x1b[0m`)
      for (let item of group[1]) {
        console.log(`    ${item.name.padEnd(longest + 2, ' ')} ${item.description}`)
      }
    }
  }
}