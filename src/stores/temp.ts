import { type ChildrenCommentsStream, type ComicStream, type CommentsStream, type ProComic, type ProPlusComic, type RandomComicStream } from "@/api"
import { GameStream, } from "@/api/game"
import { shallowRef } from "vue"
export const searchResult = new Map<string, ComicStream<ProPlusComic | ProComic>>()
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
  comicID: '',
  page: 0
}