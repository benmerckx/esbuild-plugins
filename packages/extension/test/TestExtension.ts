import {ExtensionPlugin} from '@esbx/extension'
import {build} from 'esbuild'
import {test} from 'uvu'
import * as assert from 'uvu/assert'

test('test extension plugin', async () => {
  const {outputFiles} = await build({
    target: 'esnext',
    platform: 'neutral',
    stdin: {
      contents: `import './test'`
    },
    plugins: [ExtensionPlugin],
    write: false
  })
  assert.is(outputFiles[0].text, '// <stdin>\nimport "./test.js";\n')
})

test.run()
