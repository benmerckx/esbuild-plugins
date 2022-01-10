import {ChildProcess, spawn, SpawnOptions} from 'child_process'
import type {Plugin} from 'esbuild'
import kill from 'tree-kill'

export type RunPluginOptions = {
  cmd: string
} & SpawnOptions

export const RunPlugin = {
  configure(options: RunPluginOptions): Plugin {
    return {
      name: '@esbx/run',
      setup(build) {
        let child: undefined | ChildProcess

        build.onStart(() => {
          if (child)
            return new Promise<void>(resolve => {
              const pid = child!.pid
              if (pid) kill(pid, 'SIGKILL', () => resolve())
            })
        })

        build.onEnd(res => {
          if (res.errors.length === 0)
            child = spawn(options.cmd, {
              stdio: 'inherit',
              shell: true,
              ...options
            })
        })
      }
    }
  }
}
