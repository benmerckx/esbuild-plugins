import type {OnResolveArgs, Plugin} from 'esbuild'

export type ExternalPluginResponse = void | boolean | string

export type ExternalPluginOptions = {
  filter?: RegExp
  onResolve?: (
    args: OnResolveArgs
  ) => ExternalPluginResponse | Promise<ExternalPluginResponse>
}

function plugin(options: ExternalPluginOptions = {}): Plugin {
  const filter = options.filter || options.onResolve ? /.*/ : /^[^\.].*/
  return {
    name: '@esbx/external',
    setup(build) {
      build.onResolve({filter}, async args => {
        if (args.kind === 'entry-point') return
        if (!options.onResolve) return {path: args.path, external: true}
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
