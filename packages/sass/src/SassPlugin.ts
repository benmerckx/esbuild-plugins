import type {OnLoadArgs, OnLoadResult, Plugin} from 'esbuild'
import path from 'path'
import fs from 'fs'
import postcss, {Plugin as PostCssPlugin} from 'postcss'
import postcssModules from 'postcss-modules'
import sass, {Options as SassOptions} from 'sass'

type CssModulesOptions = Parameters<postcssModules>[0]
type CacheEntry = {
  key: string
  result: OnLoadResult
  css: string
}

export type SassPluginOptions = {
  moduleOptions: CssModulesOptions
  scssOptions: SassOptions<'sync'>
  postCssPlugins?: Array<PostCssPlugin>
}

const defaults: SassPluginOptions = {
  moduleOptions: {
    localsConvention: 'dashes'
  },
  scssOptions: {
    loadPaths: ['./node_modules']
  }
}

const isWindows = process.platform === 'win32'

function hash(files: Array<string>) {
  return files.map(file => fs.statSync(file).mtimeMs).join('-')
}

const PREFIX = '@esbx/sass:'

function plugin(options: Partial<SassPluginOptions> = {}): Plugin {
  return {
    name: '@esbx/sass',
    setup(build) {
      const cssCache = new Map<string, CacheEntry>()
      const enableSourceMaps = Boolean(build.initialOptions.sourcemap)
      const scssOptions = {
        ...defaults.scssOptions,
        sourceMap: enableSourceMaps,
        ...options.scssOptions
      }
      const moduleOptions = {
        ...defaults.moduleOptions,
        ...options.moduleOptions
      }
      const plugins = options?.postCssPlugins || []
      build.onResolve({filter: /@esbx\/sass:.*/}, args => {
        return {
          path: args.path.substr(PREFIX.length),
          namespace: PREFIX,
          pluginData: {
            resolveDir: args.resolveDir
          }
        }
      })
      build.onLoad({filter: /.*/, namespace: PREFIX}, args => {
        return {
          contents: cssCache.get(args.path)?.css,
          loader: 'css',
          resolveDir: args.pluginData.resolveDir
        }
      })
      build.onLoad(
        {filter: /\.scss$/},
        (args: OnLoadArgs): OnLoadResult | Promise<OnLoadResult> => {
          const sourceFile = args.path.split(path.sep).join('/')
          const entry = cssCache.get(sourceFile)
          if (entry && entry.key === hash(entry.result.watchFiles!)) {
            return entry.result
          }
          const {css, loadedUrls, sourceMap} = sass.compile(
            sourceFile,
            scssOptions
          )
          const isModule = args.path.endsWith('.module.scss')
          const watchFiles = loadedUrls.map(url => {
            return url.pathname.substr(isWindows ? 1 : 0)
          })
          let cssModulesJSON: any
          const cssPlugins = plugins.slice(0)
          if (isModule)
            cssPlugins.push(
              postcssModules({
                ...moduleOptions,
                getJSON(_, json) {
                  cssModulesJSON = json
                }
              })
            )
          return postcss(cssPlugins)
            .process(css, {
              from: args.path,
              map: enableSourceMaps && {inline: true, prev: sourceMap}
            })
            .then(postProcess => {
              if (!isModule) {
                const result: OnLoadResult = {
                  contents: postProcess.css,
                  loader: 'css',
                  watchFiles
                }
                cssCache.set(sourceFile, {
                  key: hash(watchFiles),
                  result,
                  css: postProcess.css
                })
                return result
              }
              const classNames = JSON.stringify(cssModulesJSON)
              const body = `
                import ${JSON.stringify(name + sourceFile)}
                export default ${classNames}
              `
              const result: OnLoadResult = {
                contents: body,
                watchFiles
              }
              cssCache.set(sourceFile, {
                key: hash(watchFiles),
                result,
                css: postProcess.css
              })
              return {contents: body, watchFiles}
            })
        }
      )
    }
  }
}

export const SassPlugin = {...plugin(), configure: plugin}

Object.defineProperty(SassPlugin, 'configure', {
  enumerable: false,
  value: plugin
})
