// Source: esbuild-plugin-alias
import type {Plugin} from 'esbuild'

export type AliasPluginOptions = {
  [key: string]: string
}

export const AliasPlugin = {
  configure(options: AliasPluginOptions): Plugin {
    const aliases = Object.keys(options)
    const filter = new RegExp(`^(${aliases.map(escapeRegExp).join('|')})$`)
    return {
      name: '@esbx/alias',
      setup(build) {
        // we do not register 'file' namespace here, because the root file won't be processed
        // https://github.com/evanw/esbuild/issues/791
        build.onResolve({filter}, args => ({
          path: options[args.path]
        }))
      }
    }
  }
}

function escapeRegExp(str: string) {
  // $& means the whole matched string
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
