import * as path from 'path'
import webpack = require('webpack')
import { MultiCompiler, MultiWatching, Configuration } from 'webpack'
import styles from './configs/styles'

// type FileTypes = 'js' | 'ts' | 'css' | 'sass' | 'less'
// type Configurations = { [K in FileTypes]: Configuration[] }

class pack {

  private watcherTimeout!: NodeJS.Timeout
  private compiler!: MultiCompiler
  private watcher!: MultiWatching | MultiCompiler
  private cwd: string = process.cwd()
  private config: Configuration[] = []

  public static js(input: string, output: string) { return new pack().js(input, output) }
  public static ts(input: string, output: string) { return new pack().ts(input, output) }
  public static sass(input: string, output: string) { return new pack().sass(input, output) }
  public static less(input: string, output: string) { return new pack().less(input, output) }
  public static style(input: string[], output: string) { return new pack().style(input, output) }
  public static scripts(input: string[], output: string) { return new pack().scripts(input, output) }

  private _webpackStart() {
    clearTimeout(this.watcherTimeout)
    this.watcherTimeout = setTimeout(() => {
      if (this.watcher && this.watcher instanceof MultiWatching) this.watcher.close(() => { })
      // this.watcher = webpack(Object.values(this.config).reduce((arr, itm) => arr.concat(itm), []), (error, stats) => {
      this.compiler = webpack(this.config)
      this.watcher = this.compiler.watch({}, (error, stats) => {
        if (error || stats.hasErrors()) {
          (<any>stats).stats.forEach((stat: any) => {
            console.log(stat.compilation.errors)
          })
          console.log(error)
        }
        else console.log(stats)
        // if (err) console.log(err)
        // else console.log(stats)
      })
    }, 1000)
    return this
  }

  public js(input: string, output: string) {
    let fullInput = path.join(this.cwd, input)
    let fullOutput = path.join(this.cwd, output)
    this.config.push({
      name: fullInput,
      entry: fullInput,
      output: {
        path: fullOutput,
        filename: path.parse(fullInput).name + '.js'
      }
    })
    return this._webpackStart()
  }

  public ts(input: string, output: string) {
    let fullInput = path.join(this.cwd, input)
    let outputDir = path.parse(path.join(this.cwd, output)).dir
    this.config.push({
      entry: fullInput,
      output: {
        path: outputDir,
        filename: path.parse(output).name + '.js'
      },
      resolve: {
        extensions: ['.tsx', '.ts', '.js']
      }
    })
    return this._webpackStart()
  }

  public sass(input: string, output: string) {
    return this
  }

  public less(input: string, output: string) {
    return this
  }

  public style(inputs: string, output: string): this
  public style(inputs: string[], output: string): this
  public style(inputs: (string[] | string), output: string) {
    this.config.push(styles(inputs, output))
    return this._webpackStart()
  }

  public scripts(inputs: string[], output: string) {
    let fullInputs = inputs.map(input => path.join(this.cwd, input))
    let outputDir = path.parse(path.join(this.cwd, output)).dir
    this.config.push({
      entry: { [path.parse(output).name]: fullInputs },
      output: {
        path: outputDir,
        filename: '[name].js'
      }
    })
    return this._webpackStart()
  }
}

export = pack