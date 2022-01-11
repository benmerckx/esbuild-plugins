import {list} from '@esbx/util'
import {dirname} from 'dirname-filename-esm'
import type {Plugin} from 'esbuild'
import path from 'path'
import {AliasPlugin} from '@esbx/alias'

const __dirname = dirname(import.meta)

export type ReactPluginOptions = {
  usePreact?: boolean
}

function plugin(options: ReactPluginOptions = {}): Plugin {
  return {
    name: '@esbx/react',
    setup(build) {
      const config = build.initialOptions
      if (options.usePreact) {
        AliasPlugin.configure({
          react: 'preact/compat',
          'react-dom': 'preact/compat'
        }).setup(build)
      }
      build.initialOptions.loader = {...config.loader, '.js': 'jsx'}
      build.initialOptions.inject = list(
        config.inject,
        path.join(
          __dirname,
          options.usePreact ? 'PreactShim.js' : 'ReactShim.js'
        )
      )
    }
  }
}

export const ReactPlugin = {...plugin(), configure: plugin}

Object.defineProperty(ReactPlugin, 'configure', {
  enumerable: false,
  value: plugin
})
