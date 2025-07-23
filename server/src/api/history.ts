import { Hono, type Context } from "hono"
import { toPairs, uniq, fromPairs, isString, sortBy } from "lodash-es"
import { getWithChunk, remove, updateWithChunk } from "../db"
import { createSuccess, isType, util } from "../res"
import { patchWatchHistory, patchSearchHistory } from '../tp'
import type { TypeOf } from "zod"
import { cors } from "hono/cors"
import { enc } from "crypto-js"
export const history = new Hono<{}, {}, '/:uuid/history'>()

history.use("/*", cors())
history.get('/watch', async c => {
  const request = c.req
  const data: [string, [string, string, number, number]][] = await getWithChunk(`${request.param('uuid')}.history.watch`)
  const sendData = fromPairs(data.map(v => {
    do { v[1][1] = JSON.parse((enc.Utf8.stringify(enc.Base64.parse(v[1][1])))) } while (isString(v[1][1]))
    console.log('sendData', v[1][1], isString(v[1][1]))

    return v
  }).filter(v => !!v[1][1]))
  return createSuccess(c, sendData)
}).patch(async c => {
  const request = c.req
  const data = await request.json()
  if (!isType(data, patchWatchHistory)) return util.typeError(c)
  const baseData: TypeOf<typeof patchWatchHistory> = fromPairs(await getWithChunk(`${request.param('uuid')}.history.watch`)) ?? []
  const newData = { ...baseData, ...data }
  const uploadData = toPairs(newData).map(v => {
    v[1][1] = enc.Base64.stringify(enc.Utf8.parse(JSON.stringify(v[1][1])))
    return v
  })
  await updateWithChunk(`${request.param('uuid')}.history.watch`, uploadData)
  return createSuccess(c, newData)
})

history.get('/search', async c => {
  const request = c.req
  const data = await getWithChunk(`${request.param('uuid')}.history.search`)
  return createSuccess(c, data ?? [])
}).patch(async c => {
  const request = c.req
  const data = await request.json()
  if (!isType(data, patchSearchHistory)) return util.typeError(c)
  const _data = patchSearchHistory.parse(data)
  const baseData: TypeOf<typeof patchSearchHistory> = (await getWithChunk(`${request.param('uuid')}.history.search`)) ?? []
  const newData = uniq(baseData.concat(_data)).reverse().filter((_v, i) => i < 10)
  await updateWithChunk(`${request.param('uuid')}.history.search`, newData, true)
  return createSuccess(c, newData)
}).delete(async c => {
  const request = c.req
  await remove(`${request.param('uuid')}.history.search`)
  return createSuccess(c, [])
})
