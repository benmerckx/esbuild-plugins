import {SwcPlugin, SwcPluginOptions} from '@esbx/swc'
import type {Plugin} from 'esbuild'

function plugin(options: SwcPluginOptions = {}): Plugin {
  return {
    name: '@esbx/legacy',
    setup(build) {
      const {plugins = []} = build.initialOptions
      for (const plugin of plugins)
        if (plugin.name === '@esbx/swc')
          throw new Error(
            `Cannot add legacy plugin after swc plugin, adjust its settings instead`
          )
      build.initialOptions.target = 'es5'
      SwcPlugin.configure({
        swcOptions: {
          env: {
            coreJs: '3',
            mode: 'usage',
            targets: {
              ie: '11'
            }
          },
          jsc: {
            target: 'es5'
          }
        },
        ...options
      }).setup(build)
    }
  }
}

export const LegacyPlugin = {...plugin(), configure: plugin}

Object.defineProperty(LegacyPlugin, 'configure', {
  enumerable: false,
  value: plugin
})
