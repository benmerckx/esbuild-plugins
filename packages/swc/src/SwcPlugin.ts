import swc, {Options as SwcOptions} from '@swc/core'
import type {Plugin} from 'esbuild'
import path from 'path'
import fs from 'fs'

export type SwcPluginOptions = {
  filter?: RegExp
  exclude?: Array<string>
  swcOptions?: SwcOptions
}

function plugin(options: SwcPluginOptions = {}): Plugin {
  const filter = options.filter || /\.[t|j]sx?$/
  const exclude = ['core-js', '@swc', 'regenerator-runtime'].concat(
    options.exclude || []
  )
  const swcOptions: SwcOptions = {
    ...options.swcOptions,
    sourceMaps: 'inline'
  }
  return {
    name: '@esbx/swc',
    setup(build) {
      const cache = new Map()
      build.onLoad({filter}, args => {
        for (const excluded of exclude)
          if (args.path.startsWith(excluded)) return
        const key = String(fs.statSync(args.path).mtimeMs)
        const entry = cache.get(args.path)
        if (entry && entry.key === key) return entry.result
        const extension = path.extname(args.path)
        const sx = extension.startsWith('.t') ? 'tsx' : 'jsx'
        return swc
          .transformFile(args.path, {
            ...swcOptions,
            jsc: {
              ...swcOptions.jsc,
              parser: {
                syntax: extension.startsWith('.ts')
                  ? 'typescript'
                  : 'ecmascript',
                [sx]: extension.includes('sx'),
                dynamicImport: true
              }
            }
          })
          .then(res => {
            const result = {contents: res.code}
            cache.set(args.path, {key, result})
            return result
          })
      })
    }
  }
}

export const SwcPlugin = {...plugin(), configure: plugin}

Object.defineProperty(SwcPlugin, 'configure', {
  enumerable: false,
  value: plugin
})
