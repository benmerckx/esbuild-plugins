import type {Plugin} from 'esbuild'

// https://github.com/evanw/esbuild/issues/622#issuecomment-769462611
export const ExtensionPlugin: Plugin = {
  name: '@esbx/extension',
  setup(build) {
    build.initialOptions.bundle = true
    const outExtension = build.initialOptions.outExtension?.['.js'] || '.js'
    build.onResolve({filter: /.*/}, ({kind, path}) => {
      if (kind === 'entry-point') return
      const isLocal = path.startsWith('./') || path.startsWith('../')
      const hasOutExtension = path.endsWith(outExtension)
      const hasExtension = path.split('/').pop()?.includes('.')
      if (isLocal && hasExtension && !hasOutExtension) return
      if (hasOutExtension || !isLocal) return {path, external: true}
      return {path: path + outExtension, external: true}
    })
  }
}
