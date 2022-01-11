import {findPackages, report} from '@esbx/util'
import fs from 'fs-extra'
import glob from 'glob'
import path from 'path'
import {pkgMeta} from '../util'

export function versionAction(semver: string) {
  const root = pkgMeta(process.cwd())
  const packages = findPackages(glob.sync, root.workspaces || [])
  const metas = packages.map(location => {
    return {location, meta: pkgMeta(location)}
  })
  const names = new Set(metas.map(m => m.meta.name))
  for (const pkg of packages) {
    const meta = pkgMeta(pkg)
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
      path.join(pkg, 'package.json'),
      JSON.stringify(meta, null, 2)
    )
  }
  report(`bumped version to ${semver}`)
}
