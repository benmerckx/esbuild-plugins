import {findNodeModules, findPackages, list} from '@esbx/util'
import {build} from 'esbuild'
import glob from 'glob'
import path from 'path'
import {StaticPlugin} from '@esbx/static'
import {loadConfig, pkgMeta} from '../util'

export async function testAction(pattern?: string) {
  const config = await loadConfig(process.cwd())
  const filter = (pattern || 'Test').toLowerCase()
  const root = pkgMeta(process.cwd())
  const packages = findPackages(glob.sync, root.workspaces || [])
  const files = packages.flatMap(location =>
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
  await build({
    bundle: true,
    format: 'esm',
    platform: 'node',
    ...config,
    outfile: 'bin/test.js',
    banner: {
      js: `import "data:text/javascript,process.argv.push('.bin/uvu')" // Trigger isCLI`
    },
    external: list(external, config.external),
    plugins: list(
      config.plugins,
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
  const testFile = 'file://' + path.join(process.cwd(), 'bin/test.js')
  await import(testFile)
}
