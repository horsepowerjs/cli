import * as path from 'path'
import * as fs from 'fs'
import MiniCssExtractPlugin = require('mini-css-extract-plugin')
const WebpackOnBuildPlugin = require('on-build-webpack')

export default function (inputs: string | string[], output: string) {
  let cwd: string = process.cwd()
  let fullInputs = Array.isArray(inputs) ? inputs.map(input => path.join(cwd, input)) : path.join(cwd, inputs)
  let outputDir = path.parse(path.join(cwd, output)).dir
  return {
    entry: { [path.parse(output).name]: fullInputs },
    output: {
      path: outputDir
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: '[name].css',
        chunkFilename: '[id].css',
        ignoreOrder: false
      }),
      new WebpackOnBuildPlugin(function () {
        fs.unlinkSync(path.join(outputDir, path.parse(output).name + '.js'));
      })
    ],
    module: {
      rules: [
        {
          test: /\.(scss|sass|css)$/,
          use: [{
            loader: MiniCssExtractPlugin.loader
          },
            'css-loader',
            // { loader: 'postcss-loader', options: { options: {} } },
            'sass-loader'],
          exclude: /node_modules/
        }
      ]
    }
  }
}