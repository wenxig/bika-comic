import { defineStore } from 'pinia'
import { getCategories, getCollections, getHotTags, getMe, ComicStreamWithTranslater, ComicStreamWithAuthor, ComicStreamWithUploader, AnnouncementStream, getLevelboard, getUserProfile } from '@/api'
import type { Collection, Categories, HotTag, ProPlusComic, Me, ComicStream, Levelboard, ProComic } from '@/api'
import { markRaw, reactive, shallowRef, watch } from 'vue'
import { getSearchHitory, getWatchHitory, getSubscribe, type Subscribe, isInPlusPlan, getFavourtImages, putFavourtImages, WatchHistory } from '@/api/plusPlan'
import { SmartAbortController } from '@/utils/requset'
import type { AxiosRequestConfig } from 'axios'
import { getNewUpdatesComic } from '@/api/plusPlan'
import { searchResult } from './temp'
import { type FavourtImage } from '@/api/plusPlan'
import config from '@/config'
import localforage from 'localforage'
import symbol from '@/symbol'

export type DevData = {
  name: string,
  data: (Record<string, any> | string | number | (any[]))[]
}

const _searchHistory = await localforage.getItem<string[]>(symbol.searchHistory) ?? []

type ReadHistory = Record<string, WatchHistory>
const _readHistory = await localforage.getItem<ReadHistory>(symbol.searchHistory) ?? {}

export const useAppStore = defineStore('app', () => {
  const categories = shallowRef<Categories[]>([])

  const hotTags = shallowRef<HotTag[]>([])

  const collections_list = shallowRef<Collection[]>([])

  const searchHistory = shallowRef<string[]>(_searchHistory)
  watch(searchHistory, v => localforage.setItem(symbol.searchHistory, v))

  const readHistory = shallowRef<ReadHistory>(_readHistory)
  localforage.getItem<ReadHistory>(symbol.searchHistory).then(v => readHistory.value = v ?? {})
  watch(readHistory, v => localforage.setItem(symbol.readHistory, v))
  const $reloadReadHistory = async (config: AxiosRequestConfig = {}) => {
    const data = await getWatchHitory(config)
    if (!data) return
    readHistory.value = data
  }

  const user = shallowRef<Me>()
  const $reloadMe = async (config: AxiosRequestConfig = {}) => {
    if (user.value) {
      user.value.favourite.reload()
      user.value.comments.reload()
      await Promise.all([
        getUserProfile(config).then(v => user.value!.data = v),
        user.value.favourite.next(),
        user.value.comments.next()
      ])
    }
    else user.value = markRaw(await getMe(config))
  }

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

  const announcements = shallowRef(new AnnouncementStream())
  const $reloadAnnouncements = async () => {
    announcements.value?.reload()
    await Promise.all([
      announcements.value?.next(),
      announcements.value?.next()
    ])
  }

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
    subscribes, showDevPupop, devData, favourtImages, levelBoard, announcements: () => announcements.value, newUpdateComics, subscribesData, subscribesUpdates, categories, collections_list, hotTags, user: () => user.value, searchHistory, readHistory,
    $reload: {
      me: $reloadMe,
      subscribes: $reloadSubscribes,
      readHistory: $reloadReadHistory,
      levelboard: $reloadLevelBoard,
      favourtImages: $reloadFavourtIamges,
      announcements: $reloadAnnouncements
    }
  }
})

export async function init() {
  const app = useAppStore()
  config.value['bika.plusPlan'] = await isInPlusPlan()
  await Promise.all([
    getCategories().then(v => app.categories = v),
    getHotTags().then(v => app.hotTags = v),
    getCollections().then(v => app.collections_list = v),
    getNewUpdatesComic().then(v => app.newUpdateComics = v),
    app.$reload.announcements(),
    getSearchHitory().then(v => v && (app.searchHistory = v)),
    app.$reload.levelboard(),
    app.$reload.readHistory(),
    app.$reload.subscribes(),
    app.$reload.me(),
    app.$reload.favourtImages(),
  ] as const)
}