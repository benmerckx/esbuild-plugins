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
      const stat = fs.lstatSync(pkg)
      if (stat.isSymbolicLink() && isChildOf(fs.readlinkSync(pkg), dir)) return
      res.push(pkg)
    })
  }
  const parent = path.dirname(dir)
  if (parent !== dir && fs.existsSync(parent))
    return res.concat(findNodeModules(parent))
  return res
}

export function findPackages(
  glob: (input: string) => Array<string>,
  locations: Array<string>
) {
  return locations
    .map(location => `${location}/package.json`)
    .flatMap(pkg => glob(pkg))
    .map(pkg => pkg.substr(0, pkg.length - '/package.json'.length))
}

export function report(message: string, success = false) {
  const status = success ? 36 : 90
  console.log(`\x1b[${status}m> ${message}\x1b[39m`)
}

export async function reportTime(
  run: () => Promise<void>,
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
    report(message(e as Error))
  }
}
