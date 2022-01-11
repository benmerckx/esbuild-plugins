import {findPackages} from '@esbx/util'
import {execSync} from 'child_process'
import glob from 'glob'
import {pkgMeta} from '../util'

export function publishAction() {
  const root = pkgMeta(process.cwd())
  const packages = findPackages(glob.sync, root.workspaces || [])
  for (const pkg of packages) {
    try {
      execSync('npm publish --access public --tolerate-republish', {
        stdio: 'inherit',
        cwd: pkg
      })
    } catch (e) {
      // NPM will log enough information
    }
  }
}
