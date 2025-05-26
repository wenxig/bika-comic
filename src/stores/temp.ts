import { type ChildrenCommentsStream, type ComicStreamI, type CommentsStream, type Ep, type Page, type ProComic, type ProPlusComic, type ProPlusMaxComic, type RandomComicStream } from "@/api"
import { GameStream, } from "@/api/game"
import { reactive, shallowRef } from "vue"
export type SearchStreamType = ComicStreamI<ProPlusComic | ProComic| ProPlusMaxComic>
export const searchResult = new Map<string, SearchStreamType>()
export const searchListScroolPosition = new Map<string, number>()

export const comments = new Map<string, CommentsStream>()
export const commentsScroll = new Map<string, number>()
export const childrenComments = new Map<string, ChildrenCommentsStream>()
export const childrenCommentsScroll = new Map<string, number>()

export const game = {
  game: <GameStream | undefined>undefined,
  scroll: 0
}

export const random = {
  stream: <undefined | RandomComicStream>undefined,
  scroll: 0
}

export const userPageScroll = {
  history: 0,
  favourt: 0,
  image: 0,
  comment: 0
}
export const isShowSetupPage = shallowRef(false)

export const brushComic = {
  comicIndex: 0,
  page: 0
}

export const preloadEps = reactive(new Map<string, Promise<Ep[]>>())
export const preloadPages = reactive(new Map<string, Promise<Page[]>>())
export const preloaInfo = reactive(new Map<string, Promise<ProPlusMaxComic | false>>())
export const preloadLikes = reactive(new Map<string, Promise<ProComic[]>>())