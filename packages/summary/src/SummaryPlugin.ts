import type {Plugin} from 'esbuild'
import prettyBytes from 'pretty-bytes'

export const SummaryPlugin: Plugin = {
  name: '@esbx/summary',
  setup(build) {
    build.initialOptions.metafile = true
    build.onEnd(res => {
      const outputs = Object.entries(res.metafile!.outputs).sort(
        (a, b) => b[1].bytes - a[1].bytes
      )
      for (const [path, info] of outputs) {
        if (!path.endsWith('.js')) continue
        console.log(
          `\n\x1B[36m${path.padEnd(42 + 5, ' ')}\x1B[39m \x1B[1m${prettyBytes(
            info.bytes
          ).padStart(7, ' ')}\x1B[22m`
        )
        const inputs = Object.entries(info.inputs)
        const bundles: {[key: string]: number} = {}
        for (const [path, input] of inputs) {
          const parts = path.split('/')
          let bundleName
          if (parts[0] !== 'node_modules')
            bundleName = [parts[0], parts[1]].join('/')
          else if (parts[1].startsWith('@'))
            bundleName = [parts[1], parts[2]].join('/')
          else bundleName = parts[1]
          if (!bundles[bundleName]) bundles[bundleName] = input.bytesInOutput
          else bundles[bundleName] += input.bytesInOutput
        }
        const entries = Object.entries(bundles)
          .sort((a, b) => b[1] - a[1])
          .filter(e => e[1] > 0)
        entries.forEach(([bundle, size], i) => {
          if (size === 0) return
          const last = i === entries.length - 1
          const weight = size / info.bytes
          const blocks = 50
          const filled = Math.round(weight * blocks)
          const graph = '\x1B[36m' + '●'.repeat(filled) + '\x1B[39m'

          console.log(
            ` ${last ? '└' : '├'}── ${bundle.padEnd(42, ' ')} ${prettyBytes(
              size
            ).padStart(7, ' ')} ${graph}`
          )
        })
      }
    })
  }
}
