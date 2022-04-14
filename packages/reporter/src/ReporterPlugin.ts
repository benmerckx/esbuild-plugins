import {report} from '@esbx/util'
import type {Plugin} from 'esbuild'
import prettyMs from 'pretty-ms'

export type ReporterPluginOptions = {
  name?: string
}

function plugin(options: ReporterPluginOptions = {}): Plugin {
  return {
    name: '@esbx/reporter',
    setup(build) {
      const title = options?.name || 'Build'
      let start: [number, number] | undefined
      let isRebuilding = false

      build.onStart(() => {
        if (start) {
          isRebuilding = true
          report(`${title} building...`, true)
        }
        start = process.hrtime()
      })

      build.onEnd(res => {
        const hasErrors = res.errors.length > 0
        const timing = process.hrtime(start)
        const duration = prettyMs(
          (timing[0] * 1000000000 + timing[1]) / 1000000
        )
        if (hasErrors) report(`${title} has errors`, false)
        else {
          if (isRebuilding) {
            process.stdout.moveCursor(0, -1)
            process.stdout.clearLine(1)
          }
          report(`${title} completed\x1b[90m in ${duration}`, false, true)
        }
      })
    }
  }
}

export const ReporterPlugin = {...plugin(), configure: plugin}

Object.defineProperty(ReporterPlugin, 'configure', {
  enumerable: false,
  value: plugin
})
