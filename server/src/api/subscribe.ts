import { Hono } from "hono"
import { remove, uniqBy } from "lodash-es"
import { updateWithChunk, getWithChunk } from "../db"
import { createSuccess, isType, util } from "../res"
import { patchSubscribe, removeSubscribe } from '../tp'
import type { TypeOf } from "zod"
export const subscribe = new Hono<{}, {}, '/:uuid/subscribe'>()
subscribe.get('/', async c => {
  const request = c.req
  const data: TypeOf<typeof patchSubscribe> = await getWithChunk(`${request.param('uuid')}.subscribes`)
  return createSuccess(c, data ?? [])
}).patch(async c => {
  const request = c.req
  const data = await request.json()
  if (!isType(data, patchSubscribe)) return util.typeError(c)
  const _data = patchSubscribe.parse(data)
  const baseData: TypeOf<typeof patchSubscribe> = (await getWithChunk(`${request.param('uuid')}.subscribes`)) ?? []
  const newData = uniqBy(baseData.concat(_data), v => v.id)
  await updateWithChunk(`${request.param('uuid')}.subscribes`, newData, true)
  return createSuccess(c, newData)
}).delete(async c => {
  const request = c.req
  if (!request.query('ids')) return util.typeError(c)
  const data = JSON.parse(decodeURIComponent(request.query('ids')!)) as string[]
  if (!isType(data, removeSubscribe)) return util.typeError(c)
  const _data = removeSubscribe.parse(data)
  const dataGroup: TypeOf<typeof patchSubscribe> = (await getWithChunk(`${request.param('uuid')}.subscribes`)) ?? []
  remove(dataGroup, d => _data.includes(d.id))
  await updateWithChunk(`${request.param('uuid')}.subscribes`, dataGroup, true)
  return createSuccess(c, dataGroup)
})