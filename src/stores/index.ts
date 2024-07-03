import { defineStore } from 'pinia'
import { getCategories, getCollections, getHotTags, getMe, ComicStreamWithTranslater, ComicStreamWithAuthor, ComicStreamWithUploader, getAnnouncements, getLevelboard } from '@/api'
import type { Collection, Categories, HotTag, ProPlusComic, Me, ComicStream, Announcement, Levelboard, ProComic } from '@/api'
import { reactive, shallowRef, watch } from 'vue'
import { uniq } from 'lodash-es'
import { getSearchHitory, getWatchHitory, getSubscribe, type Subscribe, isInPlusPlan, getFavourtImages, putFavourtImages, WatchHistory } from '@/api/plusPlan'
import { SmartAbortController } from '@/utils/requset'
import type { AxiosRequestConfig } from 'axios'
import { getNewUpdatesComic } from '@/api/plusPlan'
import { searchResult } from './temp'
import { type FavourtImage } from '@/api/plusPlan'
import config from '@/config'

export type DevData = {
  name: string,
  data: (Record<string, any> | string | number | (any[]))[]
}
export const useAppStore = defineStore('app', () => {
  const categories = shallowRef<Categories[]>([])

  const hotTags = shallowRef<HotTag[]>([])

  const collections_list = shallowRef<Collection[]>([])

  const searchHistory = shallowRef<string[]>(JSON.parse(localStorage.getItem('searchHistory') || '[]'))
  watch(searchHistory, v => {
    localStorage.setItem('searchHistory', JSON.stringify(v))
    v = uniq(v)
  })

  const readHistory = shallowRef<Record<string, WatchHistory>>(JSON.parse(localStorage.getItem('readHistory') || '{}'))
  watch(readHistory, v => localStorage.setItem('readHistory', JSON.stringify(v)))
  const $reloadReadHistory = async (config: AxiosRequestConfig = {}) => {
    const data = await getWatchHitory(config)
    if (!data) return
    readHistory.value = data
  }

  const user = shallowRef<Me>()
  const $reloadMe = async (config: AxiosRequestConfig = {}) => user.value = await getMe(config)

  const subscribes = shallowRef<Subscribe[]>([])
  const subscribesUpdates = shallowRef<ProPlusComic[]>([])
  type SubscribesData = ComicStream<ProComic | ProPlusComic>
  const subscribesData = shallowRef<Record<string, SubscribesData>>({})
  const $reloadSubscribes = (config: AxiosRequestConfig = {}) => getSubscribe(config).then(v => v && (subscribes.value = v))
  const newUpdateComics = shallowRef<ProPlusComic[]>()
  watch(subscribes, subscribes => {
    console.log('change subscribes')
    const obj: Record<string, SubscribesData> = {}
    for (const data of subscribes) {
      if (searchResult.has(data.id)) {
        var s: SubscribesData = searchResult.get(data.id)!
        s.next()
        obj[data.id] = s
        continue
      }
      switch (data.type) {
        case 'translater': {
          var s: SubscribesData = new ComicStreamWithTranslater(data.name)
          break
        }
        case 'anthor': {
          var s: SubscribesData = new ComicStreamWithAuthor(data.name)
          break
        }
        case 'uploader': {
          var s: SubscribesData = new ComicStreamWithUploader(data.name) as any
          break
        }
      }
      searchResult.set(data.id, s)
      s.next()
      obj[data.id] = s
    }
    subscribesData.value = obj
  })

  const announcements = shallowRef<Announcement[]>([])

  const levelBoard = shallowRef<Levelboard>({
    comics: [[], [], []],
    users: []
  })
  const $reloadLevelBoard = async (c: AxiosRequestConfig = {}) => levelBoard.value = await getLevelboard(c)

  const favourtImages = reactive<{ value: FavourtImage[] }>({ value: [] })
  const favourtIamgesSac = new SmartAbortController()
  watch(favourtImages, v => {
    console.log('change favourt images')
    putFavourtImages(v.value, { signal: favourtIamgesSac.signal })
  })
  const $reloadFavourtIamges = (c: AxiosRequestConfig = {}) => getFavourtImages(c).then(v => v && (favourtImages.value = v))


  const devData = reactive(new Map<string, DevData>())
  const showDevPupop = shallowRef(false)
  return {
    subscribes, showDevPupop, devData, favourtImages, levelBoard, announcements, newUpdateComics, subscribesData, subscribesUpdates, categories, collections_list, hotTags, user, searchHistory, readHistory,
    $reload: {
      me: $reloadMe,
      subscribes: $reloadSubscribes,
      readHistory: $reloadReadHistory,
      levelboard: $reloadLevelBoard,
      favourtImages: $reloadFavourtIamges
    }
  }
})

const sac = new SmartAbortController()
export async function init() {
  const app = useAppStore()
  config.value['bika.plusPlan'] = await isInPlusPlan()
  const datas = await Promise.all([
    getCategories({ signal: sac.signal }),
    getHotTags({ signal: sac.signal }),
    getCollections({ signal: sac.signal }),
    getNewUpdatesComic({ signal: sac.signal }),
    getAnnouncements({ signal: sac.signal }),
    getSearchHitory({ signal: sac.signal }),
    app.$reload.levelboard({ signal: sac.signal }),
    app.$reload.readHistory({ signal: sac.signal }),
    app.$reload.subscribes({ signal: sac.signal }),
    app.$reload.me({ signal: sac.signal }),
    app.$reload.favourtImages({ signal: sac.signal }),
  ] as const)
  app.$patch({
    categories: datas[0],
    hotTags: datas[1],
    collections_list: datas[2],
    newUpdateComics: datas[3],
    announcements: datas[4].slice(3)
  })
  if (datas[5]) app.$patch({
    searchHistory: datas[5]
  })
}