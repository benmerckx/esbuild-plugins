import sade from 'sade'
import {buildAction} from './action/Build.js'
import {publishAction} from './action/Publish.js'
import {testAction} from './action/Test.js'
import {versionAction} from './action/Version.js'

const prog = sade('esbx')

prog
  .command('build')
  .describe('Build workspaces')
  .option('-c, --config', `Config file location`)
  .option('-w, --watch', `Watch for changes to source files`)
  .option('-st, --skip-types', `Skip generating typescript types`)
  .action(buildAction)
  .command('version <semver>')
  .describe('Version workspaces')
  .action(versionAction)
  .command('test [pattern]')
  .describe('Test workspaces')
  .action(testAction)
  .command('publish')
  .describe('Publish workspaces')
  .action(publishAction)

prog.parse(process.argv)
