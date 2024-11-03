import oldVersion from './old_package.json'
import newVersion from '../package.json'
const updatedList = process.argv.slice(2)
const oldDependenciesVer = new Array<[string, string]>()
const oldDevDependenciesVer = new Array<[string, string]>()
const newDependenciesVer = new Array<[string, string]>()
const newDevDependenciesVer = new Array<[string, string]>()
for (const [list, map] of [
  [oldDependenciesVer, oldVersion.dependencies],
  [oldDevDependenciesVer, oldVersion.devDependencies],
  [newDependenciesVer, newVersion.dependencies],
  [newDevDependenciesVer, newVersion.devDependencies]
] as const) {
  for (const key in map) {
    if (updatedList.includes(key)) {
      list.push([key, map[key]])
    }
  }
}
for (const [o, n] of [
  [oldDependenciesVer, newDependenciesVer],
  [oldDevDependenciesVer, newDevDependenciesVer],
] as const) {
  const list = o.map(([k, ov]) => [k, ov, n.find(v => v[0] == k)![1]])
  for (const row of list) {
    if (row[1] != row[2]) console.log(`${row[0]}: ${row[1]} -> ${row[2]} `)
  }
}