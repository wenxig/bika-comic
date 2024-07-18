import { defineStore } from 'pinia'
import { type ProComic, type ProPlusComic, type ProPlusMaxComic, type Ep } from '@/api'
import { ref } from 'vue'
import { last } from 'lodash-es'

export type ComicPreload = {
  comic?: ProPlusMaxComic | false
  preload?: ProComic | ProPlusComic | ProPlusMaxComic
  likeComic?: ProComic[]
  eps: Ep[]
}

export const useComicStore = defineStore('comic', () => {
  const lastsComics = new Map<string, ComicPreload>()
  const comic = ref<ComicPreload>({
    comic: undefined,
    preload: undefined,
    eps: [],
    likeComic: undefined
  })
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
        lastsComics.delete(v._id)
        lastsComics.set(v._id, comic.value = lastsComics.get(v._id) ?? {
          comic: undefined,
          preload: v,
          eps: [],
          likeComic: undefined
        })
      }
    }
  }
  const $setupComic = (v: NonNullable<ComicPreload['comic']>, cid?: string) => {
    switch (v) {
      case false: {
        if (typeof cid !== 'string') return
        lastsComics.delete(cid)
        lastsComics.set(cid, comic.value = lastsComics.get(cid) ?? {
          comic: false,
          preload: {} as any,
          eps: [],
          likeComic: undefined
        })
        return
      }
      case undefined: return
      default: {
        lastsComics.delete(v._id)
        lastsComics.set(v._id, comic.value = lastsComics.get(v._id) ?? {
          comic: v,
          preload: v,
          eps: [],
          likeComic: undefined
        })
      }
    }
  }
  const $getLatest = () => last([...lastsComics.values()])
  const $setComic = (v: ComicPreload['comic']) => {
    if (v==undefined) return
    comic.value.comic = v
    return comic.value.comic
  }
  const $load = (v: ComicPreload) => comic.value = v
  return { lastsComics, comic, $setupPreload, $setupComic, $getLatest, $setComic, $load }
})
