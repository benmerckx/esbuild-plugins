import {findPackages, reportTime, list} from '@esbx/util'
import {execSync} from 'child_process'
import {build} from 'esbuild'
import fs, {remove} from 'fs-extra'
import glob from 'glob'
import path from 'path'
import {tsconfigResolverSync} from 'tsconfig-resolver'
import which from 'which'
import {ExtensionPlugin} from '@esbx/extension'
import {loadConfig, orFail, pkgMeta} from '../util'

type BuildOptions = {
  watch?: boolean
  config?: string
  'skip-types'?: string
}

// Todo: a lot of things can go haywire here, do some proper error reporting
export async function buildAction(options: BuildOptions) {
  const config = await loadConfig(process.cwd())
  const selected = process.argv.slice(3).filter(arg => !arg.startsWith('-'))
  const skipTypes = options['skip-types'] || !fs.existsSync('tsconfig.json')
  const meta = pkgMeta(process.cwd())
  const packages = findPackages(glob.sync, meta.workspaces || [])
  const tsc = orFail(
    () => which.sync('tsc'),
    'No typescript binary found, is it installed?'
  )
  const tsConfig = !skipTypes ? tsconfigResolverSync() : undefined
  if (!skipTypes) {
    reportTime(
      async () => {
        execSync(tsc, {stdio: 'inherit', cwd: process.cwd()})
      },
      err => {
        if (err) return `type errors found`
        else return `types built`
      }
    )
  }

  async function buildPackage(root: string, location: string) {
    const meta = JSON.parse(
      await fs.promises.readFile(path.join(location, 'package.json'), 'utf-8')
    )
    const cwd = path.join(root, location)
    const entryPoints = glob.sync('src/**/*.{ts,tsx}', {cwd})
    if (!skipTypes) {
      const dist = path.join(cwd, 'dist')
      await remove(dist)
      const typeDir = path.join(
        tsConfig!.config?.compilerOptions?.outDir || '.types',
        location.substr('packages/'.length),
        'src'
      )
      if (fs.existsSync(typeDir)) await fs.copy(typeDir, dist)
    }
    reportTime(
      async () => {
        for (const entryPoint of entryPoints) {
          if (entryPoint.endsWith('.d.ts')) continue
          const sub = path.dirname(entryPoint).substr('src/'.length)
          await build({
            format: 'esm',
            loader: {'.json': 'json'},
            ...config,
            absWorkingDir: cwd,
            bundle: true,
            sourcemap: true,
            entryPoints: [entryPoint],
            outdir: path.join('dist', sub),
            plugins: list(ExtensionPlugin, config.plugins)
          })
        }
      },
      err => {
        if (err) return `${meta.name} has errors`
        else return `${meta.name} built`
      }
    )
  }
  for (const pkg of packages) {
    const isSelected =
      selected.length > 0 ? selected.some(w => pkg.includes(w)) : true
    if (isSelected) await buildPackage(process.cwd(), pkg)
  }
}
