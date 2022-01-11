import type {Plugin} from 'esbuild'
import {createServer, ServerResponse} from 'http'

export const ReloadPlugin: Plugin = {
  name: '@esbx/reload',
  setup(build) {
    const clients: Array<ServerResponse> = []

    const server = createServer((req, res) => {
      clients.push(
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Access-Control-Allow-Origin': '*',
          Connection: 'keep-alive'
        })
      )
    })

    build.onEnd(() => {
      for (const res of clients) res.write('data: update\n\n')
      clients.length = 0
    })

    return new Promise(resolve => {
      server.listen(0, function () {
        const info = server.address()
        if (info && typeof info === 'object') {
          build.initialOptions.banner = {
            js: `(() => new EventSource('http://127.0.0.1:${info.port}').onmessage = () => location.reload())();`
          }
        }
        resolve()
      })
    })
  }
}
