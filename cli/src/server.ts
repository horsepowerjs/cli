import * as cp from 'child_process'
import * as path from 'path'
import chalk from 'chalk'
import * as chokidar from 'chokidar'
import ServerListCommand from './hp-commands/server/list'
// import * as fs from 'fs'
// import * as glob from 'glob'
// import * as sass from 'node-sass'
// import mkdirp = require('mkdirp')
// import * as typescript from 'typescript'
// import * as uglify from 'uglify-es'
// import rimraf = require('rimraf')
// import concat = require('concat')
// import deepmerge = require('deepmerge')

// The main server process
let server: null | cp.ChildProcess

// Watch to make sure the child process is running
let interval: NodeJS.Timeout | null = setInterval(watch, 1000)

process.on('exit', () => process.stdout.write(`Process "${process.pid}" has exited`))

let cwd = (process.argv[2] ? process.argv[2] : process.cwd()).replace(/\\/g, '/')

let startTime = Date.now()

// Watch major directories for file changes and restart the server if a file changes
chokidar.watch([
  path.join(cwd, 'app'),
  path.join(cwd, 'config'),
  path.join(cwd, 'routes')
]).on('all', serverChange)

// chokidar.watch(path.join(cwd, 'resources/assets/styles'), {
//   awaitWriteFinish: { stabilityThreshold: 100 }
// }).on('all', stylesChange)

// chokidar.watch(path.join(cwd, 'resources/assets/scripts'), {
//   awaitWriteFinish: { stabilityThreshold: 100 }
// }).on('all', scriptsChange)

let maxRestarts = 5
let restarts = 0

// Creates a new server instance at startup or upon file change
// Basically anytime the server goes down
async function createServer() {
  if (server) return
  try {
    console.log(chalk.blueBright(`[${new Date().toUTCString()}] Starting the development server`))

    server = cp.spawn('node', [path.join(cwd, 'index.js')], { windowsHide: true })
    server.stdout && server.stdout.on('data', chunk => process.stdout.write(chunk))
    server.stderr && server.stderr.on('data', chunk => process.stderr.write(chunk))

    server.on('close', () => {
      server = null
      console.log(chalk.greenBright(`[${new Date().toUTCString()}] Sever has successfully shut down`))
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
    console.log(chalk.blueBright(`[${new Date().toUTCString()}] File changed, restarting the development server`))
    server.kill()
  }
}

// function stylesChange(c: any, file: string) {
//   if (Date.now() - startTime < 2000) return
//   let changed = file.replace(/\\/g, '/')
//     .replace(path.posix.join(cwd, 'resources/assets/styles/'), '')
//   let cFile = path.posix.parse(file)
//   console.log(chalk.blueBright(`[${new Date().toUTCString()}] ${cFile.ext.endsWith('.css') ? 'CSS' : 'SASS'} file "${changed}" has changed`))
//   glob(path.join(cwd, 'resources/assets/styles/**/[^_]*.{scss,sass,css}'), async (err, files) => {
//     for (let file of files) {
//       // file = file.replace(/\\/g, '/').replace(/^.:/i, '')
//       let f = path.posix.parse(file)

//       // If this is a sass partial file skip it
//       if (f.name.startsWith('_') && (f.ext.endsWith('.scss') || f.ext.endsWith('.sass'))) continue

//       // Create the save file based on the source file
//       let savePath = file
//         .replace(path.posix.join(cwd, 'resources/assets/styles'), '')
//         .replace(/(sass|scss)$/, 'css')

//       // make the directory so the file can be saved
//       if (!fs.existsSync(path.posix.join(cwd, 'public/css')))
//         mkdirp.sync(path.posix.join(cwd, 'public/css', path.posix.parse(savePath).dir))

//       // If the file is a css file, just copy it
//       if (f.ext.endsWith('.css')) {
//         let writeLocation = path.posix.join(cwd, 'public/css', savePath)
//         fs.createReadStream(file).pipe(fs.createWriteStream(writeLocation))
//         console.log(chalk.blueBright(`[${new Date().toUTCString()}] CSS file "${writeLocation.replace(cwd + '/', '')}" written`))
//         continue
//       }

//       // This must be a main sass file, compile it
//       let writeLocation = path.posix.join(cwd, 'public/css', savePath)
//       let result = sass.renderSync({ file, outputStyle: 'compressed' })
//       let css = result.css.toString()

//       await new Promise(resolve => fs.writeFile(writeLocation, css, (err) => err ? resolve(err) : resolve()))

//       console.log(chalk.blueBright(`[${new Date().toUTCString()}] CSS file "${writeLocation.replace(cwd + '/', '')}" written`))
//     }
//   })

// }


// function scriptsChange(c: any, file: string) {
//   if (Date.now() - startTime < 2000) return
//   let changed = file.replace(/\\/g, '/')
//     .replace(path.posix.join(cwd, 'resources/assets/scripts/'), '')
//   let cFile = path.posix.parse(file)
//   console.log(chalk.blueBright(`[${new Date().toUTCString()}] ${cFile.ext.endsWith('.ts') ? 'TS' : 'JS'} file "${changed}" has changed`))
//   glob(path.join(cwd, 'resources/assets/scripts/**/tsconfig.json'), async (err, files) => {
//     for (let file of files) {

//       let pathInfo = path.posix.parse(file)
//       // Load the configuration
//       let options: any = await new Promise(resolve => fs.readFile(file, (err, data) => resolve(JSON.parse(data.toString()))))

//       if (fs.existsSync(path.join(__dirname, '../resources/temp/scripts')))
//         rimraf.sync(path.join(__dirname, '../resources/temp/scripts/*'))

//       options = deepmerge(options, {
//         compilerOptions: <typescript.CompilerOptions>{
//           outDir: path.join(__dirname, '../resources/temp/scripts')
//         }
//       })

//       // Parse the configuration file
//       let config = typescript.parseJsonConfigFileContent(options, typescript.sys, pathInfo.dir)
//       // Create the program and generate the output
//       let program = typescript.createProgram(config.fileNames, config.options)
//       let emitResult = program.emit()

//       let allDiagnostics = typescript
//         .getPreEmitDiagnostics(program)
//         .concat(emitResult.diagnostics);

//       allDiagnostics.forEach(diagnostic => {
//         if (diagnostic.file) {
//           let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
//             diagnostic.start!
//           );
//           let message = typescript.flattenDiagnosticMessageText(
//             diagnostic.messageText,
//             "\n"
//           );
//           console.log(
//             `${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`
//           );
//         } else {
//           console.log(
//             `${typescript.flattenDiagnosticMessageText(diagnostic.messageText, "\n")}`
//           );
//         }
//       })

//       let files = await new Promise<string[]>(r => glob(path.join(__dirname, '../resources/temp/scripts/**/*.js'), (err, files) => r(files)))

//       let result: uglify.MinifyOutput = await new Promise(resolve => {
//         concat(files).then((result: string) => {
//           resolve(uglify.minify(result, {
//             compress: true,
//             mangle: true
//           }))
//         })
//       })


//       result.error && console.log(result.error)
//       if (!result.error)
//         fs.writeFile(path.join(cwd, 'public/js/app.min.js'), result.code, () => {
//           if (err)
//             console.error(chalk.redBright(`[${new Date().toUTCString()}] JS file "public/js/app.js" was not minified`))
//           else
//             console.log(chalk.blueBright(`[${new Date().toUTCString()}] JS file "public/js/app.min.js" written`))
//         })

//     }
//   })
// }