import {report} from '@esbx/util'
import fs from 'fs-extra'
import path from 'path'
import {Task} from 'esbx'
import {getManifest, getWorkspaces} from './util.js'

export const VersionTask: Task<(semver: string) => void> = {
  command: 'version <semver>',
  description: 'Version workspaces',
  action(semver) {
    const root = getManifest(process.cwd())
    const workspaces = getWorkspaces(process.cwd())
    const metas = workspaces.map(location => {
      return {location, meta: getManifest(location)}
    })
    const names = new Set(metas.map(m => m.meta.name))
    for (const {location, meta} of metas) {
      if (!meta.version) continue
      for (const dep of [
        'dependencies',
        'peerDependencies',
        'optionalDependencies'
      ])
        for (const name of Object.keys(meta[dep] || {}))
          if (names.has(name)) meta[dep][name] = semver
      meta.version = semver
      fs.writeFileSync(
        path.join(location, 'package.json'),
        JSON.stringify(meta, null, 2)
      )
    }
    report(`bumped version to ${semver}`)
  }
}
