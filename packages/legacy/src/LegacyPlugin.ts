import swc from '@swc/core'
import type {Plugin} from 'esbuild'
import path from 'path'
import fs from 'fs'

export const LegacyPlugin: Plugin = {
  name: '@esbx/legacy',
  setup(build) {
    const cache = new Map()
    build.initialOptions.target = 'es5'
    build.onLoad({filter: /\.[t|j]sx?$/}, args => {
      if (
        args.path.includes('core-js') ||
        args.path.includes('@swc') ||
        args.path.includes('regenerator-runtime')
      ) {
        return
      }
      const key = String(fs.statSync(args.path).mtimeMs)
      const entry = cache.get(args.path)
      if (entry && entry.key === key) return entry.result
      const extension = path.extname(args.path)
      const sx = extension.startsWith('.t') ? 'tsx' : 'jsx'
      return swc
        .transformFile(args.path, {
          sourceMaps: 'inline',
          env: {
            coreJs: '3',
            mode: 'usage',
            targets: {
              ie: '11'
            }
          },
          jsc: {
            target: 'es5',
            // causes '_setPrototypeOf' is undefined in ie11
            // - app without - 410kB gzipped
            // - app with - 397kB gzipped
            // externalHelpers: true,
            parser: {
              syntax: extension.startsWith('.ts') ? 'typescript' : 'ecmascript',
              [sx]: extension.includes('sx'),
              dynamicImport: true
            },
            transform: {}
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
