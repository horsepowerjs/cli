import { Command, CmdArguments } from '../Command';
import { OptionDefinition } from 'command-line-args';
import * as cp from 'child_process'
import * as os from 'os'

interface RemovePackageOptions {
  name: string
}

interface NPMPackage {
  name: string
  scope: string
  version: string
  description: string
  date: string
  links: {
    npm: string
  }
  publisher: {
    username: string
    email: string
  },
  maintainers: any[]
}

export default class extends Command {
  public name: string = 'package:remove'
  public description: string = 'Removes a supported horsepower package'
  public options: CmdArguments[] = [{ name: 'name', defaultOption: true }]

  public async fire(options: RemovePackageOptions) {
    if (!options.name) throw new Error('A package name must be set')
    let packageName = options.name

    if (!packageName.startsWith('@horsepower')) packageName = `@horsepower/${packageName}`

    cp.exec(`npm search @horsepower --json`, (err, stdout, stderr) => {
      if (!err) {
        let packages = JSON.parse(stdout) as NPMPackage[]
        let horsepowerPackage = packages.find(p => p.name == packageName)
        if (horsepowerPackage) {
          let cmd = os.platform().toLowerCase() == 'win32' ? 'npm.cmd' : 'npm'
          let i = cp.spawn(cmd, ['rm', '-s', horsepowerPackage.name])
          i.stdout.on('data', data => console.log(data.toString()))
          i.on('error', (e) => { console.error(e) })
        }
      }
    })
  }
}