import type { AxiosRequestConfig } from "axios"
import { createClassFromResponse, PromiseContent, Stream } from "@/utils/data"
import { picapiRest, recommendRest, type RawStream, type SortType } from ".."
import { FullComic, type RawFullComic, type RawLessComic, LessComic } from "../comic"

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

export const getFavouriteComic = PromiseContent.fromAsyncFunction((page: number, sort: SortType, signal?: AbortSignal) => createClassFromResponse(picapiRest.get<{ comics: RawStream<RawLessComic> }>(`/users/favourite?s=${sort}&page=${page}`, { signal }), LessComic))


export const createFavouriteComicStream = (sort: SortType) => {
  new Stream<LessComic>(async function* (signal, that) {
    while (true) {
      if (that.pages.value == that.page.value) break
      const result = await getFavouriteComic(that.page.value, sort, signal)
      that.pages.value = result.pages
      that.total.value = result.total
      that.pageSize.value = result.limit
      that.page.value = Number(result.page)
      yield result.docs
    }
    const result = await getFavouriteComic(that.page.value, sort, signal)
    that.pages.value = result.pages
    that.total.value = result.total
    that.pageSize.value = result.limit
    that.page.value = Number(result.page)
    return result.docs
  })
}
