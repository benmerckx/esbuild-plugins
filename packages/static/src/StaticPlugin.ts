import type {Plugin} from 'esbuild'
import path from 'path'
import fs from 'fs-extra'

export type StaticPluginOptions = {
  /** Defaults to 'static' */
  destination?: string
  /** Set source dir in case no entryPoints were set */
  sources?: Array<string>
}

function plugin(options: StaticPluginOptions = {}): Plugin {
  const dir = options.destination || 'static'
  return {
    name: '@esbx/static',
    setup(build) {
      const {
        entryPoints,
        outdir,
        outfile,
        absWorkingDir = process.cwd()
      } = build.initialOptions
      if (!entryPoints && !options.sources) return
      const locations = new Set(
        (Array.isArray(entryPoints)
          ? entryPoints
          : entryPoints
          ? Object.values(entryPoints)
          : options.sources!
        ).map(path.dirname)
      )
      const makeAbs = (p: string) =>
        path.isAbsolute(p) ? p : path.join(absWorkingDir, p)
      const outputDir = outdir || (outfile && path.dirname(outfile))
      if (!outputDir) throw new Error('StaticPlugin requires outfile or outdir')
      let trigger: Promise<any>
      build.onStart(() => {
        const tasks = []
        for (const location of locations) {
          const source = path.join(makeAbs(location), dir)
          const target = path.join(makeAbs(outputDir), dir)
          if (fs.existsSync(source)) {
            const task = fs.copy(source, target, {overwrite: true})
            tasks.push(task)
          }
        }
        trigger = Promise.all(tasks)
      })
      build.onEnd(() => trigger)
    }
  }
}

export const StaticPlugin = {...plugin(), configure: plugin}

Object.defineProperty(StaticPlugin, 'configure', {
  enumerable: false,
  value: plugin
})
