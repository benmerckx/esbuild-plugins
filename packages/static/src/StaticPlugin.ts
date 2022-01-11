import type {Plugin} from 'esbuild'
import path from 'path'
import fs from 'fs-extra'

export type StaticPluginOptions = {
  destination?: string
  sources?: Array<string>
}

function plugin(options: StaticPluginOptions = {}): Plugin {
  const dir = options.destination || 'static'
  return {
    name: '@esbx/static',
    setup(build) {
      const {entryPoints, outdir, outfile} = build.initialOptions
      if (!entryPoints && !options.sources) return
      const locations = Array.isArray(entryPoints)
        ? entryPoints
        : entryPoints
        ? Object.values(entryPoints)
        : options.sources!
      const outputDir = outdir || (outfile && path.dirname(outfile))
      if (!outputDir) throw new Error('StaticPlugin requires outfile or outdir')
      build.onStart(async () => {
        const tasks = []
        for (const location of locations) {
          const source = path.join(path.dirname(location), dir)
          if (fs.existsSync(source)) {
            tasks.push(
              fs.copy(source, path.join(outputDir, dir), {overwrite: true})
            )
          }
        }
        if (tasks.length === 0) return
        await Promise.all(tasks)
      })
    }
  }
}

export const StaticPlugin = {...plugin(), configure: plugin}

Object.defineProperty(StaticPlugin, 'configure', {
  enumerable: false,
  value: plugin
})
