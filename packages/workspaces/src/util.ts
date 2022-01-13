import fs from 'fs-extra'
import path from 'path'
import glob from 'glob'

export function getManifest(location: string) {
  return fs.readJSONSync(path.join(location, 'package.json'))
}

export function findPackages(locations: Array<string>) {
  return locations
    .map(location => `${location}/package.json`)
    .flatMap(pkg => glob.sync(pkg))
    .map(pkg => pkg.substr(0, pkg.length - '/package.json'.length))
}

export function getWorkspaces(location: string) {
  const meta = fs.readJSONSync(path.join(location, 'package.json'))
  return findPackages(meta.workspaces || [])
}

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
