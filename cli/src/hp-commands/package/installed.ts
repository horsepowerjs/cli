import { Command, CmdArguments } from '../Command'
import * as path from 'path'

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
  maintainers: any[],
  dependencies: { [key: string]: string }
  devDependencies: { [key: string]: string }
}

export default class extends Command {
  public name: string = 'package:installed'
  public description: string = 'A list of all installed horsepower packages'
  public options: CmdArguments[] = [{ name: 'name', defaultOption: true }]

  public async fire() {
    let jsonPath = path.join(process.cwd(), 'package.json')
    let result = await import(jsonPath) as NPMPackage
    let dependencies = Object.keys(result.dependencies).reduce<string[]>((a, i) => i.startsWith('@horsepower') ? a.concat(i) : a, [])
    let devDependencies = Object.keys(result.devDependencies).reduce<string[]>((a, i) => i.startsWith('@horsepower') ? a.concat(i) : a, [])
    let packages = [...new Set(...[...dependencies, ...devDependencies])]

    let longest = 0
    packages.forEach(p => longest = p.length > longest ? p.length : longest)
    packages.forEach(pkg => {
      console.log(`\x1b[32m${pkg.padEnd(longest + 2, ' ')}\x1b[0m`)
    })
  }
}