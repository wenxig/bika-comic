import { defineStore } from 'pinia'
import { AnnouncementStream, getLevelboard, getMyProfile } from '@/api'
import { Collection, Categories, HotTag, ProPlusComic, Me, Levelboard } from '@/api'
import { markRaw, ref, shallowRef, watch } from 'vue'
import { getWatchHitory, isInPlusPlan, getFavourtImages, putFavourtImages, SearchHistory, WatchHistory, YestdayUpdateComics } from '@/api/plusPlan'
import { SmartAbortController } from '@/utils/requset'
import type { AxiosRequestConfig } from 'axios'
import { type FavourtImage } from '@/api/plusPlan'
import config from '@/config'
import localforage from 'localforage'
import symbol from '@/symbol'

const _searchHistory = await localforage.getItem<string[]>(symbol.searchHistory) ?? []

type ReadHistory = Record<string, WatchHistory>
const _readHistory = await localforage.getItem<ReadHistory>(symbol.searchHistory) ?? {}

const _user = await localforage.getItem<Me>(symbol.userTemp) ?? undefined

export const useAppStore = defineStore('app', () => {
  const categories = shallowRef<Categories[]>([])

  const hotTags = shallowRef<HotTag[]>([])

  const collections_list = shallowRef<Collection[]>([])

  const searchHistory = shallowRef<SearchHistory[]>(_searchHistory)
  watch(searchHistory, v => localforage.setItem(symbol.searchHistory, v))

  const readHistory = shallowRef<ReadHistory>(_readHistory)
  localforage.getItem<ReadHistory>(symbol.readHistory).then(v => readHistory.value = v ?? {})
  watch(readHistory, v => {
    for (const key in v) {
      console.log('check read history', key, v[key], !(v[key] instanceof WatchHistory));
      
      if (!(v[key] instanceof WatchHistory)) {
        continue
      }
      v[key]=v[key].toJSON() as any
    }
    console.log('change read history', v);
    
    localforage.setItem(symbol.readHistory, v)
  })
  const $reloadReadHistory = async (config: AxiosRequestConfig = {}) => {
    const data = await getWatchHitory(config)
    if (!data) return
    readHistory.value = data
  }

  const user = shallowRef<Me | undefined>(_user)
  const $reloadMe = async (config: AxiosRequestConfig = {}) => {
    if (user.value) {
      user.value.favourite.reload()
      user.value.comments.reload()
      await Promise.all([
        getMyProfile(config).then(v => user.value!.data = v),
        user.value.favourite.next(),
        user.value.comments.next()
      ])
    }
    else user.value = markRaw(await Me.getFromNet(config))
  }

  const yesterdayUpdateComics = shallowRef<ProPlusComic[]>()

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

  const favourtImages = ref<FavourtImage[]>([])
  const favourtIamgesSac = new SmartAbortController()
  let isFavourtImagesSetup = false
  watch(favourtImages, v => {
    console.log('change favourt images', v)
    if (!isFavourtImagesSetup) return isFavourtImagesSetup = true
    favourtIamgesSac.abort()
    putFavourtImages(<FavourtImage[]>v, { signal: favourtIamgesSac.signal })
  }, { deep: true })
  const $reloadFavourtIamges = (c: AxiosRequestConfig = {}) => getFavourtImages(c).then(v => v && (favourtImages.value = v))


  const showDevPupop = shallowRef(false)


  return {
    showDevPupop, favourtImages, levelBoard, announcements: () => announcements.value, yesterdayUpdateComics, categories, collections_list, hotTags, user: () => user.value, searchHistory, readHistory,
    $reload: {
      me: $reloadMe,
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
    Categories.getFromNet().then(v => app.categories = v),
    HotTag.getFromNet().then(v => app.hotTags = v),
    Collection.getFromNet().then(v => app.collections_list = v),
    YestdayUpdateComics.getFromNet().then(v => app.yesterdayUpdateComics = v),
    app.$reload.announcements(),
    SearchHistory.get().then(v => v && (app.searchHistory = v)),
    app.$reload.levelboard(),
    app.$reload.readHistory(),
    app.$reload.me(),
    app.$reload.favourtImages(),
  ] as const)
}