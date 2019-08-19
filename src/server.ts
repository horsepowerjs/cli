import * as cp from 'child_process'
import * as path from 'path'
import * as fs from 'fs'
import * as glob from 'glob'
import chalk from 'chalk'
import * as sass from 'node-sass'
import * as chokidar from 'chokidar'
import ServerListCommand from './hp-commands/server/list';
import mkdirp = require('mkdirp');

// The main server process
let server: null | cp.ChildProcess

// Watch to make sure the child process is running
let interval: NodeJS.Timeout | null = setInterval(watch, 1000)

process.on('exit', () => process.stdout.write(`Process "${process.pid}" has exited`))

let cwd = process.argv[2] ? process.argv[2] : process.cwd()

// Watch major directories for file changes and restart the server if a file changes
chokidar.watch([
  path.join(cwd, 'app'),
  path.join(cwd, 'config'),
  path.join(cwd, 'routes')
]).on('all', serverChange)

chokidar.watch(path.join(cwd, 'resources/assets/styles')).on('all', sassChange)

let maxRestarts = 5
let restarts = 0

// Creates a new server instance at startup or upon file change
// Basically anytime the server goes down
async function createServer() {
  if (server) return
  try {
    console.log(chalk.blueBright(`Starting the development server at [${new Date().toLocaleString()}]`))

    server = cp.spawn('node', [path.join(cwd, 'index.js')], { windowsHide: true })
    server.stdout && server.stdout.on('data', chunk => process.stdout.write(chunk))
    server.stderr && server.stderr.on('data', chunk => process.stderr.write(chunk))

    server.on('close', () => {
      server = null
      console.log(chalk.greenBright(`Sever has successfully shut down at [${new Date().toLocaleString()}]`))
    })
    restarts = 0
    ServerListCommand.addServer(cwd, process.pid)
  } catch (e) {
    if (restarts++ >= maxRestarts) {
      exit()
    }
  }
}

function exit() {
  interval && clearInterval(interval)
  process.kill(process.pid)
}

// Watch the server to make sure it is running
async function watch() {
  if (!server) await createServer()
}

function serverChange() {
  if (server) {
    console.log(chalk.blueBright(`File changed at [${new Date().toLocaleString()}] restarting the development server`))
    server.kill()
  }
}

function sassChange() {
  glob(path.join(cwd, 'resources/assets/styles/**/*.{scss,sass,css}'), async (err, files) => {
    for (let file of files) {
      let f = path.parse(file)

      // If this is a sass partial file skip it
      if (f.name.startsWith('_') && (f.name.endsWith('scss') || f.name.endsWith('sass'))) continue

      // Create the save file based on the source file
      let savePath = file
        .replace(path.join(cwd, 'resources/assets/styles'), '')
        .replace(/(sass|scss)$/, 'css')

      // make the directory so the file can be saved
      mkdirp.sync(path.join(cwd, 'public/css', path.parse(savePath).dir))

      // If the file is a css file, just copy it
      if (f.ext == '.css') {
        fs.createReadStream(file).pipe(fs.createWriteStream(path.join(cwd, 'public/css', savePath)))
        continue
      }

      // This must be a main sass file, compile it
      sass.render({
        file,
        outputStyle: 'compressed'
      }, async (err, result) => {
        if (err) return
        let css = result.css.toString()
        await new Promise(r => fs.writeFile(path.join(cwd, 'public/css', savePath), css, (err) => r()))
      })
    }
  })

}