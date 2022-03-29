import {list} from '@esbx/util'
import {BuildOptions, Plugin, build} from 'esbuild'
import path from 'path'
import {ExternalPlugin} from '@esbx/external'

export async function evaluate(file: string, buildOptions?: BuildOptions) {
  const options: BuildOptions = {
    ...buildOptions,
    format: 'esm',
    stdin: undefined,
    bundle: true,
    write: false,
    metafile: true
  }
  const outExtension = options.outExtension?.['.js'] || '.js'
  const outFile = `out${outExtension}`
  const {metafile, outputFiles} = await build({
    ...options,
    entryPoints: {out: file},
    outdir: '.',
    plugins: list(
      ExternalPlugin.configure({makeAbsolute: true}),
      options.plugins
    )
  })
  const out = outputFiles!.find(f => f.path.endsWith(outFile))!
  const watchFiles = Object.keys(metafile!.inputs)
  const dataurl = `data:text/javascript;base64,${Buffer.from(
    out.contents
  ).toString('base64')}`
  const exports = await import(dataurl)
  return {exports, watchFiles}
}

export const EvalPlugin: Plugin = {
  name: '@esbx/eval',
  setup(build) {
    build.onResolve({filter: /^eval:.*/}, args => {
      return {
        namespace: 'eval',
        path: path.join(args.resolveDir, args.path.slice('eval:'.length))
      }
    })

    build.onLoad({filter: /.*/, namespace: 'eval'}, async args => {
      const {exports, watchFiles} = await evaluate(
        args.path,
        build.initialOptions
      )
      if (typeof exports.default !== 'string')
        throw new Error(
          `Expected eval import "${path}" to contain a default export`
        )
      return {
        loader: 'js',
        contents: exports.default,
        watchFiles,
        resolveDir: path.dirname(args.path)
      }
    })
  }
}
