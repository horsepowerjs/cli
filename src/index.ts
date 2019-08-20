#!/usr/bin/env node
import * as cmdArgs from 'command-line-args'
import { OptionDefinition } from 'command-line-args'
process.argv.push('--color')
import chalk from 'chalk'
import * as path from 'path'
import * as fs from 'fs'
import * as glob from 'glob'
import { Command } from './hp-commands/Command'
import { isHorsepowerProject, notAProject } from './helper'
import ListCommands, { ItemInfo } from './hp-commands/list'

export const error = chalk.red
export const warning = chalk.yellow
export const info = chalk.cyan

/** @type {string} The Location of the current directory the script is executing within (This is where a horsepower project should be living) */
export const PATH: string = process.cwd()

/** @type {string} The root location of where the resources such as template files live */
export const RESOURCES: string = path.join(__dirname, '../resources')

const mainDefinitions: OptionDefinition[] = [
  { name: 'command', defaultOption: true },
  { name: 'version', alias: 'v', defaultValue: '1' },
  { name: 'help', alias: 'h', defaultValue: '1' }
]


/**
 * Tests if a path is the location of an existing file or directory
 *
 * @export
 * @param {string} path The path to the file
 * @returns {Promise<boolean>}
 */
export async function isFile(path: string): Promise<boolean> {
  return new Promise<boolean>(resolve => {
    fs.stat(path, (err, stats) => resolve(err ? false : stats.isFile() || stats.isDirectory()))
  })
}

/**
 * Replaces the template variables with data
 *
 * @export
 * @param {string} data The template string
 * @param {[string, string][]} replacements The replacement data where `index 0` is the key and `index 1` is the value
 * @returns {string} The new template with the variables replaced
 */
export function replaceTemplateVars(data: string, replacements: [string, string][]): string {
  replacements.forEach(item => {
    let [find, replace] = item
    data = data.replace(new RegExp('\\$\\$\\{\\{' + find + '\\}\\}', 'g'), replace)
  })
  return data
}


// interface Option {
//   name: Options
//   description: string
// }

// enum Options {
//   New = 'new', Serve = 'serve',
//   Add = 'add', Remove = 'remove',
//   MakeController = 'make:controller',
//   MakeMiddleware = 'make:middleware',
//   CommandMake = 'command:make',
//   Help = 'help'
// }

// let options: Option[] = [
//   { name: Options.New, description: 'Creates a new project' },
//   { name: Options.MakeController, description: `Makes a new controller` },
//   { name: Options.MakeMiddleware, description: `Makes a new middleware` },
//   { name: Options.CommandMake, description: `Makes a new command` },
//   { name: Options.Serve, description: 'Serves the current project' },
// ]

async function runCommand() {
  const mainOptions = cmdArgs(mainDefinitions, { stopAtFirstUnknown: true } as any)
  if (mainOptions.version === null) {
    try {
      let packages = await new Promise<string[]>(r => glob(path.join(process.cwd(), 'node_modules/@horsepower/*/package.json'), (e, res) => r(res)))
      let longest = 0
      let info = []
      for (let file of packages) {
        let json = await import(file)
        longest = json.name.length > longest ? json.name.length : longest
        info.push({ name: json.name, version: json.version })
      }
      info.forEach(str => console.log(`${str.name.padEnd(longest, ' ')} -> ${str.version}`))
    } catch (e) {
      console.log(error('This is not a working horsepower application'))
    }
  } else {
    try {
      switch (mainOptions.command) {
        // case Options.Serve:
        //   // serve()
        //   console.log(warning('Not yet implemented'))
        //   break
        // case Options.Help:
        //   let longest = options.reduce<number>((s, v) => v.name.length > s ? v.name.length : s, 0)
        //   for (let opt of options) {
        //     console.log(''.padStart(2) + `${opt.name}`.padEnd(longest + 4) + `${opt.description}`)
        //   }
        //   break
        default:
          try {
            let [command_group, command_name] = mainOptions.command.split(':')
            // Makes sure this is a horsepower project before running the command unless this is a new project
            let isProject = await isHorsepowerProject()
            // console.log(command_group, command_name)
            // console.log(command_group != 'new', command_name != '', isProject)
            // let horsepowerProject =
            if (
              (command_group != 'new' && command_name != '' && !isProject) &&
              (command_group != 'list' && command_name != '' && !isProject) &&
              (command_group != 'server' && !['start', 'stop', 'log'].includes(command_name))
            ) {
              return notAProject()
            }

            // Gets the command to execute
            let cmd = await ListCommands.getCommand(command_group, command_name) as ItemInfo

            // Loads the command and creates an instance
            let reqCmd = await import(cmd.file)
            let command: Command
            if (reqCmd && reqCmd.default) command = new reqCmd.default()
            else command = new reqCmd()

            // This is a help command, show the help information and exit
            if (mainOptions.help === null) {
              let defaultOption = command.options.find(i => i.defaultOption || false)

              // Log the command
              console.log(`\x1b[32musage: horsepower ${command.name} ${defaultOption ? `<${defaultOption.name}>` : ''}\x1b[0m\n`)

              // Log the description
              console.log(`${command.description || ''}\n`)
              let longest = command.options.reduce((acc, val) => val.name.length > acc && !val.defaultOption ? val.name.length : acc, 0)

              // Log all the values and their description
              command.options.forEach(opt => {
                if (opt.defaultOption) return
                console.log(`    ${opt.alias ? '-' + opt.alias + ', ' : ''}--${opt.name.padEnd(longest + 2, ' ')} ${opt.description || ''}`)
              })
              return
            }

            try {
              // Make sure the name and description are set and are correct
              if (!command.name) throw new Error('Command does not have a name')
              else if (!command.description) throw new Error('Command does not have a description')
              else if (command.name != mainOptions.command) throw new Error(`Command name mismatch: "${mainOptions.command}" -> "${command.name}"`)
              // Executes the command
              else await command.fire(command.makeArgs(mainDefinitions))
            } catch (e) {
              console.log(e)
            }
          } catch (e) {
            console.log(error(`Command "${mainOptions.command}" was not found`))
            console.log('  horsepower <command> [options]')
            console.log('  -- Run "horsepower list" for a list of commands')
          }
          break
      }
    } catch (e) {
      console.log(error(e.message))
    }
  }
}

runCommand()