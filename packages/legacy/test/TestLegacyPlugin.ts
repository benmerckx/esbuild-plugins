import {LegacyPlugin} from '@esbx/legacy'
import {build} from 'esbuild'
import {test} from 'uvu'
import path from 'path'
import * as assert from 'uvu/assert'
import {dirname} from 'dirname-filename-esm'

const __dirname = dirname(import.meta)

test('test legacy plugin', async () => {
  const {outputFiles} = await build({
    entryPoints: [path.join(__dirname, './static/input.js')],
    plugins: [LegacyPlugin],
    write: false
  })
  assert.is(outputFiles[0].text, 'Math.pow(1, 2);\n')
})

test.run()
