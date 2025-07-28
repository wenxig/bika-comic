import type { AxiosRequestConfig } from "axios"
import { PromiseContent, Stream } from "@/utils/data"
import { picapiRest, recommendRest, type RawStream } from ".."
import { ComicEp, FullComic, LessComic, type RawComicEp, type RawFullComic, type RawLessComic } from "../comic"

export type ResultActionData<T extends string> = { action: T }
export const likeComic = PromiseContent.fromAsyncFunction(async (id: string, config: AxiosRequestConfig = {}) => picapiRest.post<ResultActionData<'like' | 'unlike'>>(`/comics/${id}/like`, {}, config))
export const favouriteComic = PromiseContent.fromAsyncFunction(async (id: string, config: AxiosRequestConfig = {}) => picapiRest.post<ResultActionData<'favourite' | 'un_favourite'>>(`/comics/${id}/favourite`, {}, config))

const infoStore = new Map<string, FullComic | false>()
export const getComicInfo = PromiseContent.fromAsyncFunction(async (id: string, config: AxiosRequestConfig = {}) => {
  if (infoStore.has(id)) return infoStore.get(id)!
  const data = (await picapiRest.get<{ comic: RawFullComic } | false>(`/comics/${id}`, config))
  if (data.data) infoStore.set(id, new FullComic(data.data.comic))
  else infoStore.set(id, false)
  return infoStore.get(id)!
})

const picIdStore = new Map<string, number>()
export const getComicPicId = PromiseContent.fromAsyncFunction(async (id: string, config: { signal?: AbortSignal } = {}) => {
  if (picIdStore.has(id)) return picIdStore.get(id)!
  const result = await recommendRest.get<{ shareId: number }>(`/pic/share/set/?c=${id}`, config)
  const picId = result.shareId
  picIdStore.set(id, picId)
  return picId
})

export const getRecommendComics = PromiseContent.fromAsyncFunction(async (id: string, signal?: AbortSignal) => (await picapiRest.get<{ comics: RawLessComic[] }>(`/comics/${id}/recommendation`, { signal })).data.comics.map(v => new LessComic(v)))


export const getComicEps = PromiseContent.fromAsyncFunction((async (id: string): Promise<ComicEp[]> => {
  const stream = Stream.apiPackager(async (page, signal) => (await picapiRest.get<{ eps: RawStream<RawComicEp> }>(`/comics/${id}/eps?page=${page}`, { signal })).data.eps)
  const eps = await stream.nextToDone()
  return eps.map(ep => new ComicEp(ep))
}))