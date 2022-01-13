import {StaticPlugin} from '@esbx/static'
import {findNodeModules, list} from '@esbx/util'
import crypto from 'crypto'
import {build, BuildOptions} from 'esbuild'
import fs from 'fs-extra'
import glob from 'glob'
import path from 'path'
import {getManifest, getWorkspaces} from './util.js'

export type TestTaskConfig = {
  buildOptions?: BuildOptions
}

function task(config: TestTaskConfig = {}) {
  return {
    command: 'test [pattern]',
    describe: 'Test workspaces',
    async action(pattern?: string) {
      const filter = (pattern || 'Test').toLowerCase()
      const root = getManifest(process.cwd())
      const workspaces = getWorkspaces(process.cwd())
      const files = workspaces.flatMap(location =>
        glob.sync(`${location}/test/**/*.{ts,tsx}`)
      )
      const modules = files.filter(file => {
        return path.basename(file).toLowerCase().includes(filter)
      })
      if (modules.length === 0) {
        console.log(`No tests found for pattern "${filter}"`)
        process.exit()
      }
      const suites = modules
        .map(
          (m, idx) => `
            globalThis.UVU_INDEX = ${idx}
            globalThis.UVU_QUEUE.push([${JSON.stringify(path.basename(m))}])
            await import(${JSON.stringify('./' + m)})
          `
        )
        .join('\n')
      const entry = `
        const {exec} = await import('uvu')
        globalThis.UVU_DEFER = 1;
        ${suites}
        exec().catch(error => {
          console.error(error.stack || error.message)
          process.exit(1)
        })
      `
      const external = findNodeModules(process.cwd())
      const outfile = path.posix.join(
        process.cwd(),
        'node_modules',
        crypto.randomBytes(16).toString('hex') + '.mjs'
      )
      await build({
        bundle: true,
        format: 'esm',
        platform: 'node',
        ...config,
        outfile,
        banner: {
          js: `import "data:text/javascript,process.argv.push('.bin/uvu')" // Trigger isCLI`
        },
        external: list(external, config.buildOptions?.external),
        plugins: list(
          config.buildOptions?.plugins,
          StaticPlugin.configure({
            sources: modules
          })
        ),
        stdin: {
          contents: entry,
          resolveDir: process.cwd(),
          sourcefile: 'test.js'
        }
      })
      await import(`file://${outfile}`)
      fs.removeSync(outfile)
    }
  }
}

export const TestTask = {...task(), configure: task}
