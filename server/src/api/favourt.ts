import { Hono } from "hono"
import { isEmpty, sortBy, uniqBy } from "lodash-es"
import { getWithChunk, updateWithChunk } from "../db"
import { createSuccess, isType, util } from "../res"
import { putFavouriteImages } from '../tp'
import type { z } from "zod"
export const favourite = new Hono<{}, {}, '/:uuid/favourite'>()
favourite.get('/image', async c => {
  const request = c.req
  const data = (<z.infer<typeof putFavouriteImages>>await getWithChunk(`${request.param('uuid')}.favourite.image`)).filter(v => !isEmpty(v)) ?? []
  return createSuccess(c, sortBy(data, v => v.time))
}).put(async c => {
  const request = c.req
  const data = await request.json()
  if (!isType(data, putFavouriteImages)) return util.typeError(c)
  const _data = putFavouriteImages.parse(data)
  await updateWithChunk(`${request.param('uuid')}.favourite.image`, _data, true)
  return createSuccess(c, sortBy(_data, v => v.time))
}).patch(async c => {
  const request = c.req
  const data = await request.json()
  if (!isType(data, putFavouriteImages)) return util.typeError(c)
  const _data = putFavouriteImages.parse(data)
  const baseData: z.infer<typeof putFavouriteImages> = (await getWithChunk(`${request.param('uuid')}.favourite.image`)) ?? []
  const newData = uniqBy(baseData.concat(_data), v => v.src)
  await updateWithChunk(`${request.param('uuid')}.favourite.image`, newData, true)
  return createSuccess(c, sortBy(newData, v => v.time))
})