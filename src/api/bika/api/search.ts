import { createClassFromResponse, createComicStream, PromiseContent, Stream } from "@/utils/data"
import { picapiRest, type RawStream, type SortType } from ".."
import { CommonComic, LessComic, spiltUsers, type RawBaseComic, type RawCommonComic, type RawLessComic } from "../comic"
import { type RawCollection, Collection, type RawCategories, Categories } from "../search"
import { uniqBy } from "lodash-es"
import { toCn, toTw } from "@/utils/translator"
export const getHotTags = PromiseContent.fromAsyncFunction(async (signal?: AbortSignal) => (await picapiRest.get<{ keywords: string[] }>("/keywords", { signal })).data.keywords)

export const getRandomComic = PromiseContent.fromAsyncFunction(async (signal?: AbortSignal) => (await picapiRest.get<{ comics: RawCommonComic[] }>(`/comics/random`, { signal })).data.comics.map(v => new CommonComic(v)))

export const createRandomComicStream = () => {
  new Stream<CommonComic>(async function* (signal, that) {
    const getComic = async () => {
      const result = await getRandomComic(signal)
      that.pages.value = Infinity
      that.total.value = Infinity
      that.pageSize.value = 20
      that.page.value++
      return result
    }
    while (true) {
      if (that.pages.value == that.page.value) break
      yield await getComic()
    }
    return await getComic()
  })
}


export const getCollections = PromiseContent.fromAsyncFunction(async (signal?: AbortSignal) => (await picapiRest.get<{ collections: RawCollection[] }>("/collections", { signal })).data.collections.map(v => new Collection(v)))

export const getCategories = PromiseContent.fromAsyncFunction(async (signal?: AbortSignal) => (await picapiRest.get<{ categories: RawCategories[] }>("/categories", { signal })).data.categories.map(v => new Categories(v)))

export namespace search {
  export type SearchResult<T extends RawBaseComic = CommonComic> = RawStream<T>
  export const getComicsByKeyword = PromiseContent.fromAsyncFunction(async (keyword: string, page = 1, sort: SortType = 'dd', signal?: AbortSignal): Promise<SearchResult> => {
    const twTag = toTw(keyword)
    const cnTag = toCn(keyword)
    if (twTag == cnTag)
      var data_TW: SearchResult = { docs: [], pages: 0, limit: 0, page: 0, total: 0 }, { data: { comics: data_CN } } = await picapiRest.post<{ comics: SearchResult }>(`/comics/advanced-search?page=${page}&sort=${sort}`, { keyword: cnTag, sort }, { signal })
    else var [{ data: { comics: data_TW } }, { data: { comics: data_CN } }] = await Promise.all([
      picapiRest.post<{ comics: SearchResult }>(`/comics/advanced-search?page=${page}&sort=${sort}`, { keyword: twTag, sort }, { signal }),
      picapiRest.post<{ comics: SearchResult }>(`/comics/advanced-search?page=${page}&sort=${sort}`, { keyword: cnTag, sort }, { signal })
    ])
    const data = uniqBy(data_TW.docs.concat(data_CN.docs), v => v._id).map(v => new CommonComic(v))
    return {
      docs: data,
      total: data.length,
      limit: NaN,
      page,
      pages: Math.max(data_TW.pages, data_CN.pages)
    }
  })
  export const createKeywordStream = (keyword: string, sort: SortType) => createComicStream(keyword, sort, getComicsByKeyword)

  export const getComicsByAuthor = PromiseContent.fromAsyncFunction(async (author: string, page = 1, sort: SortType = 'dd', signal?: AbortSignal) => {
    const data = await getComicsByKeyword(author, page, sort, signal)
    data.docs = data.docs.filter(v => spiltUsers(v.author).includes(author.trim()))
    return data
  })
  export const createAuthorStream = (author: string, sort: SortType) => createComicStream(author, sort, getComicsByAuthor)

  export const getComicsByTranslator = PromiseContent.fromAsyncFunction(async (translator: string, page = 1, sort: SortType = 'dd', signal?: AbortSignal) => {
    const data = await getComicsByKeyword(translator, page, sort, signal)
    data.docs = data.docs.filter(v => spiltUsers(v.chineseTeam).includes(translator.trim()))
    return data
  })
  export const createTranslatorStream = (translator: string, sort: SortType) => createComicStream(translator, sort, getComicsByTranslator)

  export const getComicsByUploader = PromiseContent.fromAsyncFunction(async (id: string, page = 1, sort: SortType = 'dd', signal?: AbortSignal) => createClassFromResponse(picapiRest.get<{ comics: SearchResult<RawLessComic> }>(`/comics?page=${page}&ca=${id}&s=${sort}`, { signal }), LessComic))
  export const createUploaderStream = (uploader: string, sort: SortType) => createComicStream(uploader, sort, getComicsByUploader)

  export const getComicsByCategories = PromiseContent.fromAsyncFunction(async (category: string, page = 1, sort: SortType = 'dd', signal?: AbortSignal) => createClassFromResponse(picapiRest.get<{ comics: SearchResult<RawLessComic> }>(`/comics?page=${page}&c=${encodeURIComponent(category)}&s=${sort}`, { signal }), LessComic))
  export const createCategoryStream = (category: string, sort: SortType) => createComicStream(category, sort, getComicsByCategories)

  export const getComicsByTag = PromiseContent.fromAsyncFunction(async (tag: string, page = 1, sort: SortType = 'dd', signal?: AbortSignal) => createClassFromResponse(picapiRest.get<{ comics: SearchResult<RawLessComic> }>(`/comics?page=${page}&t=${encodeURIComponent(tag)}&s=${sort}`, { signal }), LessComic))
  export const createTagStream = (tag: string, sort: SortType) => createComicStream(tag, sort, getComicsByTag)

}