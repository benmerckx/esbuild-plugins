import {LegacyPlugin} from '@esbx/legacy'
import {build} from 'esbuild'
import {test} from 'uvu'
import * as assert from 'uvu/assert'
import {ReactPlugin} from '@esbx/react'

test('test react plugin', async () => {
  const {outputFiles} = await build({
    stdin: {
      contents: `React`
    },
    plugins: [ReactPlugin],
    write: false
  })
  assert.is(outputFiles[0].text, `import * as React from "react";\nReact;\n`)
})

test('test preact options', async () => {
  const {outputFiles} = await build({
    stdin: {
      contents: `React`
    },
    plugins: [ReactPlugin.configure({usePreact: true})],
    write: false
  })
  assert.is(
    outputFiles[0].text,
    `import * as React from "preact/compat";\nReact;\n`
  )
})
test.run()
