import { error, PATH, RESOURCES, isFile, replaceTemplateVars } from '../..'
import * as mkdirp from 'mkdirp'
import * as path from 'path'
import * as fs from 'fs'
import { Command, CmdArguments } from '../Command'

interface MakeMiddlewareOptions {
  name: string
}
export default class extends Command {

  public name: string = 'make:middleware'
  public description: string = 'Creates a new middleware handler'
  public options: CmdArguments[] = [
    { name: 'name', defaultOption: true }
  ]

  public async fire(options: MakeMiddlewareOptions): Promise<void> {

    // This is the root location of the middleware
    const MIDDLEWARE_ROOT = 'app/middleware'

    // Get the path to the middleware
    const MIDDLEWARE_PATH = options.name.split('/').slice(0, -1).join('/')

    // Get the name of the middleware
    const MIDDLEWARE = options.name.split('/').pop() || ''

    // Create the directory in the middleware folder
    mkdirp.sync(path.join(PATH, MIDDLEWARE_ROOT, MIDDLEWARE_PATH))
    return new Promise<void>(async resolve => {
      let middlewarePath = path.join(PATH, MIDDLEWARE_ROOT, MIDDLEWARE_PATH, MIDDLEWARE + '.js')
      if (await isFile(middlewarePath)) {
        console.log(error('This middleware already exists.'))
        return resolve()
      }

      // Copy the template from the resources folder
      fs.createReadStream(path.join(RESOURCES, 'templates/make/middleware.tpl'))
        .pipe(fs.createWriteStream(middlewarePath))
        .on('close', () => {
          let contents = fs.readFileSync(middlewarePath).toString()
          fs.writeFileSync(middlewarePath, replaceTemplateVars(contents, [['name', MIDDLEWARE]]))
          resolve()
        })
    })
  }
}