import fs from 'fs'
import path from 'path'
import prettyMs from 'pretty-ms'

export function isChildOf(child: string, parent: string) {
  const relative = path.relative(parent, child)
  const isSubdir =
    relative && !relative.startsWith('..') && !path.isAbsolute(relative)
  return isSubdir
}

export function findNodeModules(dir: string): Array<string> {
  const res: Array<string> = []
  const moduleDir = path.join(dir, 'node_modules')
  if (fs.existsSync(moduleDir)) {
    const packages = fs.readdirSync(moduleDir)
    packages.forEach(pkg => {
      if (pkg.charAt(0) === '.') return
      const pkgLocation = path.join(moduleDir, pkg)
      const stat = fs.lstatSync(pkgLocation)
      if (stat.isSymbolicLink() && isChildOf(fs.readlinkSync(pkgLocation), dir))
        return
      res.push(pkg)
    })
  }
  const parent = path.dirname(dir)
  if (parent !== dir && fs.existsSync(parent))
    return res.concat(findNodeModules(parent))
  return res
}

type List<T> = Array<T> & {add(item: T | undefined): List<T>}

export function list<T>(...p: Array<T | undefined | Array<T>>): List<T> {
  const res = p.flat().filter(Boolean) as Array<T>
  return Object.assign(res, {
    add(item: T | undefined) {
      return list(...res, item)
    }
  })
}

export function report(message: string, success = false) {
  const status = success ? 36 : 90
  console.log(`\x1b[${status}m> ${message}\x1b[39m`)
}

export async function reportTime<T>(
  run: () => Promise<T>,
  message: (err?: Error) => string
) {
  const start = process.hrtime()
  function duration() {
    const timing = process.hrtime(start)
    return prettyMs((timing[0] * 1000000000 + timing[1]) / 1000000)
  }
  try {
    await run()
    report(`${message()}\x1b[90m in ${duration()}`, true)
  } catch (e) {
    console.dir(e)
    report(message(e as Error))
  }
}
