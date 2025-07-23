import { Hono } from "hono"
import { toPairs, fromPairs } from "lodash-es"
import { getWithChunk, updateWithChunk } from "../db"
import { createSuccess, isType, util, } from "../res"
import { patchSetting } from '../tp'
import type { TypeOf } from "zod"
export const setting = new Hono<{}, {}, '/:uuid/setting'>()
setting.get('/', async c => {
  const request = c.req
  const data = await getWithChunk(request.param('uuid'))
  return createSuccess(c, fromPairs(data))
}).put(async c => {
  const request = c.req
  const data = await request.json()
  if (!isType(data, patchSetting)) return util.typeError(c)
  const _data = patchSetting.parse(data)
  await updateWithChunk(request.param('uuid'), toPairs(_data))
  return createSuccess(c, _data)
}).patch(async c => {
  const request = c.req
  const data = await request.json()
  if (!isType(data, patchSetting)) return util.typeError(c)
  const _data = patchSetting.parse(data)
  const baseData: TypeOf<typeof patchSetting> = fromPairs(await getWithChunk(request.param('uuid'))) ?? {}
  const newData = { ...baseData, ..._data }
  await updateWithChunk(request.param('uuid'), toPairs(newData))
  return createSuccess(c, newData)
})