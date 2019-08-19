import { OptionDefinition } from 'command-line-args'
import * as cmdArgs from 'command-line-args'

export type CmdArguments = OptionDefinition & { description?: string }

export abstract class Command {
  public abstract name: string
  public abstract description: string
  public abstract options: CmdArguments[]

  public abstract fire(options: any): void

  /** @internal */
  public makeArgs(mainDefinitions: any) {
    const mainOptions = cmdArgs(mainDefinitions, { stopAtFirstUnknown: true } as any)
    let argv = mainOptions._unknown || []

    return cmdArgs(this.options, { argv, stopAtFirstUnknown: true } as any)
  }
}