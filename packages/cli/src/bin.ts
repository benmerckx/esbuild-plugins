import sade from 'sade'
import path from 'path'
import crypto from 'crypto'
import fs from 'fs'
import {build} from 'esbuild'
import {ExternalPlugin} from '@esbx/external'
import type {Task} from '.'

export async function loadTasks(
  location: string
): Promise<{[key: string]: Task}> {
  const configLocation = path.join(location, '.esbx.ts')
  if (!fs.existsSync(configLocation)) {
    console.log(`No .esbx.ts found in ${location}`)
    process.exit()
  }
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
  return exports
}

loadTasks(process.cwd())
  .then(tasks => {
    const prog = sade('esbx')
    for (const [name, task] of Object.entries(tasks)) {
      if (!('action' in task)) continue
      prog.command(task.command || name)
      if (task.description) prog.describe(task.description)
      for (const [option, description, defaultValue] of task.options || []) {
        prog.option(option, description, defaultValue)
      }
      prog.action(task.action)
    }
    prog.parse(process.argv)
  })
  .catch(e => {
    console.error(`Could not load tasks: ${e}`)
    process.exit(1)
  })
