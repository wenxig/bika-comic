import { type ChildrenCommentsStream, type ComicStream, type CommentsStream, type ProComic, type ProPlusComic, type RandomComicStream } from "@/api"
import { GameStream, } from "@/api/game"
export const searchResult = new Map<string, ComicStream<ProPlusComic | ProComic>>()
export const searchListScroolPosition = new Map<string, number>()

export const comments = new Map<string, CommentsStream>()
export const commentsScroll = new Map<string, number>()
export const childrenComments = new Map<string, ChildrenCommentsStream>()
export const childrenCommentsScroll = new Map<string, number>()

export const game = {
  game: new GameStream(),
  scroll: 0
}

export const random = {
  stream: <undefined | RandomComicStream>undefined,
  scroll: 0
}
