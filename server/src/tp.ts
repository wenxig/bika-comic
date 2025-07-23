import { z } from 'zod'

export const image = z.object({
  originalName: z.string(),
  path: z.string(),
  fileServer: z.string()
})
export const userCharacters = z.string()
export const userSex = z.enum(['f', 'm', 'bot'])
export const user = z.object({
  _id: z.string(),
  gender: userSex,
  name: z.string(),
  verified: z.boolean(),
  exp: z.number(),
  level: z.number(),
  characters: userCharacters.array(),
  role: userCharacters.optional(),
  avatar: image,
  title: z.string(),
  slogan: z.string()
})
export const proComic = z.object({
  _id: z.string(),
  title: z.string(),
  author: z.string(),
  totalViews: z.number(),
  totalLikes: z.number(),
  pagesCount: z.number(),
  epsCount: z.number(),
  finished: z.boolean(),
  categories: z.string().array(),
  thumb: image,
  likesCount: z.number(),
})

export const patchWatchHistory = z.record(z.string(), z.tuple([
  z.string(),
  z.any(),
  z.number(),
  z.number(),
]))

export const patchSearchHistory = z.string().array()

export const putFavouriteImages = z.object({
  src: z.string(),
  time: z.number(),
  comic: z.string()
}).array()

export const patchSetting = z.record(z.string(), z.any())

export const patchSubscribe = z.object({
  type: z.string(),
  id: z.string(),
  src: z.string().optional(),
  name: z.string()
}).array()

export const removeSubscribe = z.string().array()