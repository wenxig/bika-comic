import { defineStore } from 'pinia'
import { getComicEps, getComicLikeOthers, type ProComic, type ProPlusComic, type ProPlusMaxComic, type Ep, getComicInfo } from '@/api'
import { ref } from 'vue'
import { last } from 'lodash-es'
import { createStateContentData, useStateContent, type UseStateContent } from '@/utils/requset'

export interface ComicPreload {
  comic?: ProPlusMaxComic | false
  preload?: ProComic | ProPlusComic | ProPlusMaxComic
  infoStateContent?: UseStateContent<this['comic']>
  likeComic?: Awaited<ReturnType<typeof getComicLikeOthers>>
  likeComicStateContent?: UseStateContent<this['likeComic']>
  eps: Awaited<ReturnType<typeof getComicEps>>,
  epsStateContent?: UseStateContent<this['eps']>
}

export const useComicStore = defineStore('comic', () => {
  const lastsComics = new Map<string, ComicPreload>()
  const comic = ref<ComicPreload>({
    comic: undefined,
    preload: undefined,
    eps: [],
    likeComic: undefined
  })
  const $clear = () => {
    comic.value = {
      comic: undefined,
      preload: undefined,
      eps: [],
      likeComic: undefined
    }
  }
  const $setupPreload = (v: ComicPreload['preload'] | false, cid?: string) => {
    switch (v) {
      case false: {
        if (typeof cid !== 'string') return
        lastsComics.delete(cid)
        lastsComics.set(cid, comic.value = lastsComics.get(cid) ?? {
          comic: false,
          preload: undefined,
          eps: [],
          likeComic: undefined
        })
        return
      }
      case undefined: return
      default: {
        const old = lastsComics.get(v._id)
        lastsComics.delete(v._id)
        lastsComics.set(v._id, comic.value = lastsComics.get(v._id) ?? {
          comic: undefined,
          preload: v,
          eps: old?.eps.id == v._id ? old?.eps : [],
          likeComic: old?.likeComic?.id == v._id ? old?.likeComic : undefined
        })
      }
    }
  }
  const $setupComic = (v: NonNullable<ComicPreload['comic']>, cid?: string) => {
    switch (v) {
      case false: {
        if (typeof cid !== 'string') return
        lastsComics.delete(cid)
        lastsComics.set(cid, comic.value = {
          comic: false,
          preload: {} as any,
          eps: [],
          likeComic: undefined,
          infoStateContent: createStateContentData(false, false, false, true)
        })
        return
      }
      case undefined: return
      default: {
        const old = lastsComics.get(v._id)
        lastsComics.delete(v._id)
        lastsComics.set(v._id, comic.value = {
          comic: v,
          preload: v,
          eps: old?.eps.id == v._id ? old?.eps : [],
          likeComic: old?.likeComic?.id == v._id ? old?.likeComic : undefined,
          infoStateContent: createStateContentData(v, false, false, false)
        })
      }
    }
  }
  const $getLatest = () => last([...lastsComics.values()])
  const $setComic = (v: ComicPreload['comic']) => {
    if (v == undefined) return
    comic.value.comic = v
    if (v) comic.value.preload = v
    return comic.value.comic
  }
  const $load = (v: ComicPreload) => comic.value = v
  const $retryEps = () => {
    if (comic.value.preload?._id) {
      comic.value.epsStateContent = useStateContent(getComicEps(comic.value.preload?._id).then(eps => comic.value.eps = eps))
    }
  }
  const $retryLike = () => {
    if (comic.value.preload?._id) {
      comic.value.likeComicStateContent = useStateContent(getComicLikeOthers(comic.value.preload?._id).then(like => comic.value.likeComic = like))
    }
  }
  const $retryInfo = () => {
    if (comic.value.preload?._id) {
      comic.value.epsStateContent = useStateContent(getComicInfo(comic.value.preload?._id).then(info => $setComic(info)))
    }
  }
  return { lastsComics, $clear, comic, $setupPreload, $setupComic, $getLatest, $setComic, $load, $retryInfo, $retryLike, $retryEps }
})
