import * as fs from 'fs'
import * as path from 'path'
import * as cp from 'child_process'
import { error, info } from '..'
import * as rimraf from 'rimraf'
import { Command, CmdArguments } from './Command'
import ServerStartCommand from './server/start';
const clone = require('git-clone')

export interface CreateOptions {
  project: string
  type: 'typescript' | 'javascript'
}

const sourceLocation = 'https://github.com/horsepowerjs/horsepower'
const testHost = 'http://localhost:5000'

export default class extends Command {
  public name: string = 'new';
  public description: string = 'Creates a new horsepower project';
  public options: CmdArguments[] = [
    { name: 'project', defaultOption: true },
    { name: 'type', defaultValue: 'javascript', type: String, description: 'The type of project "javascript" or "typescript"' }
  ]

  public async fire(options: CreateOptions) {
    // Gets the project directory that will be created
    let projectDir = path.join(process.cwd(), options.project)
    console.log(info(`Creating project "${options.project}"`))
    // Builds the project
    let built = await this.build(projectDir, options)
    if (built) {
      console.log(info(`Installing "node_modules"`))
      // Installs the modules
      let installed = await this.installModules(projectDir)
      if (installed) {
        // Removes the git directory
        // Users should setup their own repository
        await new Promise(r => rimraf(path.join(projectDir, '.git'), () => r()))

        // Rename '.env.example' to '.env'
        await new Promise(r => fs.rename(path.join(projectDir, '.env.example'), path.join(projectDir, '.env'), () => r()))

        // console.log(info(`Starting the test server on "${testHost}"`))
        // Startup the server to make sure everything installed
        await this.startTestServer(projectDir)
        return true
      }
    }
    return false
  }

  private async  build(projectDir: string, createOptions: CreateOptions) {
    return new Promise<boolean>(resolve => {
      fs.stat(projectDir, async (err, stats) => {
        if (err) {
          // Could not find the directory, lets create the project
          return resolve(await this.cloneRepository(projectDir, createOptions))
        }
        if (process.platform == 'win32') {
          // Windows does not allow for files and directories to be named the same
          if (stats.isDirectory() || stats.isFile()) {
            // The stats of the path is a directory, we can't overwrite it
            return console.log(error(`The project "${createOptions.project}" already exists, delete the directory and run the new command again or use a different project name.`))
          } else {
            return resolve(await this.cloneRepository(projectDir, createOptions))
          }
        } else {
          if (stats.isDirectory()) {
            // The stats of the path is a directory, we can't overwrite it
            return console.log(error(`The project "${createOptions.project}" already exists, delete the directory and run the new command again or use a different project name.`))
          } else {
            // The stats of the path is a file, we can make a new project
            return resolve(await this.cloneRepository(projectDir, createOptions))
          }
        }
      })
    })
  }

  private async cloneRepository(projectDir: string, createOptions: CreateOptions) {
    return new Promise<boolean>(resolve => {
      clone(sourceLocation, projectDir, { shallow: true }, async () => {
        // If this is a typescript project compile it
        if (createOptions.type == 'typescript') {
          let result = await this.compileTypeScript(projectDir)
          console.log(result ? info('TypeScript successfully built') : error('TypeScript wasn\'t built'))
          return resolve(result)
        }

        // Clone is complete
        return resolve(true)
      })
    })
  }

  private async compileTypeScript(projectDir: string) {
    return new Promise<boolean>(resolve => {
      // Execute tsc on the project directory
      let child = cp.exec(`node ./node_modules/.bin/tsc -p "${projectDir}"`, (err, stdout, stderr) => {
        if (err) {
          console.log(error(stderr))
          return resolve(false)
        }
        console.log(info('JavaScript successfully built'))
        return resolve(true)
      })
      child.stdout.on('data', chunk => process.stdout.write(chunk))
    })
  }

  private async  installModules(projectDir: string) {
    return new Promise<boolean>(resolve => {
      // Install the node modules that are needed for the project
      cp.exec(`cd "${projectDir}" && npm install`, (err, stdout, stderr) => {
        if (err) {
          console.log(error(stderr))
          return resolve(false)
        }
        console.log(info('node_modules successfully installed'))
        return resolve(true)
      })
    })
  }

  private async startTestServer(projectDir: string) {
    await ServerStartCommand.start({ path: projectDir })
    // return new Promise<boolean>(resolve => {
    //   // cp.fork(`${path.join(projectDir, 'index.js')}`)
    //   // cp.fork('npm start')
    //   // let start = (process.platform == 'darwin' ? 'open' : process.platform == 'win32' ? 'start' : 'xdg-open')
    //   // cp.exec(start + ' ' + testHost)

    //   // cp.exec(`cd "${projectDir}" && node index.js`, (err, stdout, stderr) => {
    //   //   if (err) {
    //   //     console.log(error(stderr))
    //   //     return resolve(false)
    //   //   }
    //   //   console.log(info('node_modules successfully installed'))
    //   //   return resolve(true)
    //   // })
    // })
  }
}