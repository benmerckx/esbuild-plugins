import {execSync} from 'child_process'
import {Task} from 'esbx'
import {getWorkspaces} from './util.js'

export const PublishTask: Task = {
  command: 'publish',
  action() {
    const workspaces = getWorkspaces(process.cwd())
    for (const pkg of workspaces) {
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
}
