import {execSync} from 'child_process'
import {build} from 'esbuild'
import fs, {remove} from 'fs-extra'
import glob from 'glob'
import path from 'path'
import sade from 'sade'
import {tsconfigResolverSync} from 'tsconfig-resolver'
import which from 'which'
import {findPackages, reportTime} from '@esbx/util'
import {version} from '../package.json'

type BuildOptions = {
  watch?: boolean
  config?: string
  skipTypes?: string
}

function orFail<T>(run: () => T, message?: string | ((e: any) => string)) {
  try {
    return run()
  } catch (e) {
    if (typeof message === 'string') console.error(message)
    else if (typeof message === 'function') console.error(message(e))
    process.exit(1)
  }
}

function pkgMeta(location: string) {
  const pkg = fs.readFileSync(path.join(location, 'package.json'), 'utf-8')
  return JSON.parse(pkg)
}

// Todo: a lot of things can go haywire here, do some proper error reporting
async function buildAction(options: BuildOptions) {
  const config = options.config || '.esbx.ts'
  const selected = process.argv.slice(3).filter(arg => !arg.startsWith('-'))
  const skipTypes = options.skipTypes || !fs.existsSync('tsconfig.json')
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
            absWorkingDir: cwd,
            format: 'esm',
            sourcemap: true,
            entryPoints: [entryPoint],
            outdir: path.join('dist', sub),
            loader: {'.json': 'json'}
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

function versionAction(semver: string) {
  const root = pkgMeta(process.cwd())
  const packages = findPackages(glob.sync, root.workspaces || [])
  for (const pkg of packages) {
    const meta = pkgMeta(pkg)
    if (!meta.version) continue
    meta.version = semver
    fs.writeFileSync(
      path.join(pkg, 'package.json'),
      JSON.stringify(meta, null, 2)
    )
  }
}

const prog = sade('esbx')

prog
  .version(version)
  .command('build')
  .describe('Build workspaces')
  .option('-c, --config', `Config file location`)
  .option('-w, --watch', `Watch for changes to source files`)
  .option('-st, --skip-types', `Skip generating typescript types`)
  .action(buildAction)
  .command('version <semver>')
  .describe('Version workspaces')
  .action(versionAction)

prog.parse(process.argv)
