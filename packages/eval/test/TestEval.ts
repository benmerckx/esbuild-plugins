import {EvalPlugin, evaluate} from '@esbx/eval'
import {build} from 'esbuild'
import {test} from 'uvu'
import * as assert from 'uvu/assert'
import {dirname} from 'dirname-filename-esm'

const __dirname = dirname(import.meta)

test('evaluate', async () => {
  const {exports} = await evaluate('./static/color.js', {
    absWorkingDir: __dirname
  })
  assert.equal(exports.redText, '\u001b[31mred text\u001b[39m')
})

test('test eval plugin', async () => {
  const {outputFiles} = await build({
    target: 'esnext',
    platform: 'neutral',
    bundle: true,
    stdin: {
      contents: `import 'eval:./static/eval.js'`
    },
    plugins: [EvalPlugin],
    write: false,
    absWorkingDir: __dirname,
    minify: true
  })
  assert.is(outputFiles[0].text, 'console.log("eval");\n')
})

test.run()
