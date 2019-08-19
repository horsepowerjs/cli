const { Command } = require('@horsepower/server')

module.exports = class extends Command {

  constructor() {
    super()
    this.name = '$${{name}}'
    this.description = 'Command Description'
    this.options = []
  }

  async fire() {
    // TODO: Implement the command
  }
}