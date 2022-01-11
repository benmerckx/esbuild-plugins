import {build} from 'esbuild'
import fs from 'fs-extra'
import path from 'path'
import {ExternalPlugin} from '@esbx/external'

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
  const {outputFiles} = await build({
    format: 'esm',
    target: 'esnext',
    platform: 'node',
    bundle: true,
    plugins: [ExternalPlugin],
    entryPoints: [configLocation],
    write: false
  })
  const uri =
    'data:text/javascript;base64,' +
    Buffer.from(outputFiles[0].contents).toString('base64')
  const exports = await import(uri)
  return exports.config || {}
}
