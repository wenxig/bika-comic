import type { CommonComic } from "@/api/bika/comic"
import type { RStream } from "@/utils/data"
import { reactive, shallowRef } from "vue"

export const random = {
  stream: <undefined | RStream<CommonComic>>undefined,
  scroll: 0
}

export const userPageScroll = {
  history: 0,
  favourite: 0,
  image: 0,
  comment: 0
}
export const isShowSetupPage = shallowRef(false)

export const brushComic = {
  comicIndex: 0,
  page: 0
}

export const image = reactive({
  loaded: new Set<string>(),
  error: new Set<string>()
})