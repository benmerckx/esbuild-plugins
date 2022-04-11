import type {OnResolveArgs, Plugin} from 'esbuild'

export type ExternalPluginResponse = void | boolean | string

export type ExternalPluginOptions = {
  filter?: RegExp
  /** Boolean returns marks import as external, string return rewrites import */
  onResolve?: (
    args: OnResolveArgs
  ) => ExternalPluginResponse | Promise<ExternalPluginResponse>
  /** Resolve every external import to an absolute file url, useful when evaluating code */
  makeAbsolute?: boolean
}

function plugin(options: ExternalPluginOptions = {}): Plugin {
  const filter = options.filter || options.onResolve ? /.*/ : /^[^\.].*/
  return {
    name: '@esbx/external',
    setup(build) {
      build.onResolve({filter}, async args => {
        if (args.kind === 'entry-point') return
        if (!options.onResolve) {
          if (options.makeAbsolute) {
            const resolved = await build.resolve(args.path, {
              resolveDir: args.resolveDir
            })
            if (resolved.errors.length === 0 && !resolved.external)
              return {path: `file://${resolved.path}`, external: true}
          }
          return {path: args.path, external: true}
        }
        const result = await options.onResolve(args)
        if (typeof result === 'string') return {path: result, external: true}
        if (result) return {path: args.path, external: true}
      })
    }
  }
}

export const ExternalPlugin = {...plugin(), configure: plugin}

Object.defineProperty(ExternalPlugin, 'configure', {
  enumerable: false,
  value: plugin
})
