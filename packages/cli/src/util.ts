import {ExternalPlugin} from '@esbx/external'
import crypto from 'crypto'
import {build} from 'esbuild'
import fs from 'fs-extra'
import path from 'path'

export function orFail<T>(
  run: () => T,
  message?: string | ((e: any) => string)
) {
  try {
    return run()
  } catch (e) {
    if (typeof message === 'string') console.error(message)
    else if (typeof message === 'function') console.error(message(e))
    process.exit(1)
  }
}

export function pkgMeta(location: string) {
  const pkg = fs.readFileSync(path.join(location, 'package.json'), 'utf-8')
  return JSON.parse(pkg)
}

export async function loadConfig(location: string) {
  const configLocation = path.join(location, '.esbx.ts')
  if (!fs.existsSync(configLocation)) return {}
  const outfile = path.posix.join(
    process.cwd(),
    'node_modules',
    crypto.randomBytes(16).toString('hex') + '.mjs'
  )
  await build({
    format: 'esm',
    target: 'esnext',
    platform: 'node',
    bundle: true,
    plugins: [ExternalPlugin],
    entryPoints: [configLocation],
    outfile
  })
  const exports = await import(`file://${outfile}`)
  fs.removeSync(outfile)
  return exports.config || {}
}
