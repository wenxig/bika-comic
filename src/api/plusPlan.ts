const isOnline = useOnline()

import { useAppStore } from '@/stores'
import axios, { isAxiosError, isCancel, type AxiosRequestConfig } from 'axios'
import { HmacMD5, enc } from 'crypto-js'
import { defaultsDeep, fromPairs, isEmpty, isFunction, isObject, isString, toPairs } from 'lodash-es'
import {  ComicStreamWithAuthor, ComicStreamWithTranslater, ComicStreamWithUploader, ProPlusComic, ProPlusMaxComic, type RawProComic, type RawProPlusComic, type RawProPlusMaxComic } from '.'
import { delay } from '@/utils/delay'
import { until, useLocalStorage, useOnline } from '@vueuse/core'
import dayjs from 'dayjs'
import { errorReturn, setValue } from '@/utils/requset'
import symbol from '@/symbol'
import { shallowReactive, watch } from 'vue'
import proxyData from '@/api/proxy.json'
import { searchResult, type SearchStreamType } from '@/stores/temp'
export const api = (() => {
  const api = axios.create({
    baseURL: import.meta.env.DEV ? 'http://localhost:8787' : 'https://bika.wenxig.workers.dev',
    timeout: 10000,
  })
  api.interceptors.request.use(async v => {
    await until(isOnline).toBe(true)
    return v
  })
  api.interceptors.response.use(null, async err => {
    if (isCancel(err)) return Promise.reject(err)
    if (!isAxiosError<{
      message: any,
      code: number
    }>(err)) return Promise.reject(err)
    if (isObject(err?.request?.data)) return Promise.reject(err)
    if (!err.config) return Promise.reject(err)
    if (/^[45]/g.test(err.response?.status?.toString() ?? '')) return errorReturn(err, err.response?.data.message ?? err.message)
    if (err.config.__retryCount && err.config.retry && err.config.__retryCount >= err.config.retry) return errorReturn(err, err.response?.data.message ?? err.message)
    err.config.__retryCount = err.config?.__retryCount ?? 0
    err.config.__retryCount++
    // 重新发起请求
    await delay(3000)
    return api(err.config)
  })
  api.defaults.retry = 10 //重试次数
  return api
})()
window.$api.plus = api
interface Res<T> {
  code: number,
  data: T
}

const userLoginData = useLocalStorage(symbol.loginData, { email: '', password: '' })
try {
  const userLogin = userLoginData.value
  if (userLogin.email) var id: string | null = HmacMD5(userLogin.email, userLogin.password).toString()
  else var id: string | null = null
} catch {
  var id: string | null = null
}

export const isInPlusPlan = async (config: AxiosRequestConfig = {}) => {
  if (!id) return false
  return (await api.get<Res<boolean>>(`/${id}`, config)).data.data
}

export const joinInPlusPlan = async (config: AxiosRequestConfig = {}) => {
  if (await isInPlusPlan()) return true
  return (await api.put<Res<boolean>>(`/${id}`, {}, config)).data.data
}


type RawWatchHistory = [page: string, comic: RawProPlusMaxComic, index: number, time: number]
export class WatchHistory extends Array {
  /** @description 章节序号 */  public [0]!: string
  private comic!: ProPlusMaxComic
  public get [1](): ProPlusMaxComic {
    return this.comic
  }
  public toJSON() {
    const v = [...this]
    v[1] = this[1].toJSON()
    return v
  }
  /** @description 漫画信息 */ public set [1](v: RawProPlusMaxComic) {
    this.comic = new ProPlusMaxComic(v)
  }
  /** @description 观看页数 */ public [2]!: number
  /** @description 观看时间 */ public [3]!: number
  constructor(v: RawWatchHistory) {
    super(4)
    this[0] = v[0]
    this[1] = v[1]
    this[2] = v[2] + 1
    this[3] = v[3]
  }
}

export const getWatchHitory = async (config: AxiosRequestConfig = {}) => {
  if (!id) return false
  return fromPairs(toPairs((await api.get<Res<Record<string, RawWatchHistory>>>(`/${id}/history/watch`, config)).data.data).map(([k, v]) => [k, new WatchHistory(v)]))
}

export const patchWatchHitory = async (data: Record<string, WatchHistory>, config: AxiosRequestConfig = {}) => {
  if (!id || isEmpty(data)) return false
  return fromPairs(toPairs((await api.patch<Res<Record<string, RawWatchHistory>>>(`/${id}/history/watch`, data, config)).data.data).map(([k, v]) => [k, new WatchHistory(v)]))
}


interface RawFavourtImage {
  src: string
  time: number
  comic: string | RawProComic | RawProPlusMaxComic | RawProPlusComic
}
interface FavourtImageMeta {
  id: string,
  categories: string[],
  title: string,
  author: string
}
export class FavourtImage {
  public src!: string
  public time!: number
  private _comic!: string
  public get meta(): FavourtImageMeta {
    const turle = this._comic.split('\u1145')
    return {
      id: turle[0],
      categories: turle[1].split(','),
      title: turle[2],
      author: turle[3]
    }
  }
  public get comic(): string {
    return this._comic
  }
  public set comic(v: RawProComic | string) {
    // id \u1145 c,a,t,e,g,o,r,i,e,s \u1145 title \u1145 anouth
    if (isString(v)) this._comic = v
    else this._comic = `${v._id}\u1145${v.categories.join(',')}\u1145${v.title}\u1145${v.author}`
  }
  public get date() {
    return new Date(this.time)
  }
  public toJSON() {
    return {
      ...this,
      comic: this.comic
    }
  }
  constructor(params: RawFavourtImage) {
    setValue(this, params)
  }
}

export const getFavourtImages = async (config: AxiosRequestConfig = {}) => {
  if (!id) return false
  const data = (await api.get<Res<RawFavourtImage[]>>(`/${id}/favourt/image`, config)).data.data
  if (!data) return
  return data.map(v => new FavourtImage(v))
}

export const putFavourtImages = async (data: FavourtImage[], config: AxiosRequestConfig = {}) => {
  return (await api.put<Res<RawFavourtImage[]>>(`/${id}/favourt/image`, data, config)).data.data.map(v => new FavourtImage(v))
}

export const patchFavourtImages = async (data: FavourtImage[], config: AxiosRequestConfig = {}) => {
  if (!id || isEmpty(data)) return false
  return (await api.patch<Res<RawFavourtImage[]>>(`/${id}/favourt/image`, data, config)).data.data.map(v => new FavourtImage(v))
}

export class SearchHistory extends String {
  public static async get(config: AxiosRequestConfig = {}) {
    if (!id) return false
    const res = await api.get<Res<string[]>>(`/${id}/history/search`, config)
    return res.data.data.map(v => new SearchHistory(v))
  }
  public static async patch(data: string[], config: AxiosRequestConfig = {}) {
    if (!id || isEmpty(data)) return false
    const app = useAppStore()
    const res = await api.patch<Res<string[]>>(`/${id}/history/search`, data, config)
    app.searchHistory = res.data.data.map(v => new SearchHistory(v))
    return app.searchHistory
  }
}

export interface FillerTag {
  name: string
  mode: "unshow" | "show" | "auto"
}
export type ImageQuality = 'low' | 'medium' | 'high' | 'original'

export class UserConfig {
  public 'bika.read.preloadIamgeNumbers': number
  public 'bika.read.watchFullscreen': boolean
  public 'bika.read.vertical': boolean
  public 'bika.read.twoImage': boolean
  public 'bika.read.rtl': boolean
  public 'bika.read.imageQuality': ImageQuality
  public 'bika.search.sort': SortType
  public 'bika.search.fillerTags': FillerTag[]
  public 'bika.search.showAIProject': boolean
  public 'bika.proxy.interface': string
  public 'bika.proxy.image': string
  public 'bika.proxy.db': string
  public 'bika.proxy.chat': string
  public 'bika.subscribe.updateTime': string
  public 'bika.info.unsortComic': boolean
  public 'bika.plusPlan': boolean
  public 'bika.devMode': boolean
  public 'bika.darkMode': boolean
  public 'bika.game.search.fillerTags': FillerTag[]
  public 'bika.smallWindow.enable': boolean
  public 'bika.smallWindow.openOnQuit': boolean
  constructor(config: typeof UserConfig.default) {
    this['bika.read.preloadIamgeNumbers'] = config['bika.read.preloadIamgeNumbers']
    this['bika.read.watchFullscreen'] = config['bika.read.watchFullscreen']
    this['bika.read.vertical'] = config['bika.read.vertical']
    this['bika.read.twoImage'] = config['bika.read.twoImage']
    this['bika.read.rtl'] = config['bika.read.rtl']
    this['bika.read.imageQuality'] = config['bika.read.imageQuality']
    this['bika.search.sort'] = config['bika.search.sort']
    this['bika.search.fillerTags'] = config['bika.search.fillerTags']
    this['bika.search.showAIProject'] = config['bika.search.showAIProject']
    this['bika.proxy.interface'] = config['bika.proxy.interface']
    this['bika.proxy.image'] = config['bika.proxy.image']
    this['bika.proxy.db'] = config['bika.proxy.db']
    this['bika.proxy.chat'] = config['bika.proxy.chat']
    this['bika.subscribe.updateTime'] = config['bika.subscribe.updateTime']
    this['bika.info.unsortComic'] = config['bika.info.unsortComic']
    this['bika.plusPlan'] = config['bika.plusPlan']
    this['bika.devMode'] = config['bika.devMode']
    this['bika.darkMode'] = config['bika.darkMode']
    this['bika.game.search.fillerTags'] = config['bika.game.search.fillerTags']
    this['bika.smallWindow.enable'] = config['bika.smallWindow.enable']
    this['bika.smallWindow.openOnQuit'] = config['bika.smallWindow.openOnQuit']

  }
  static default = {
    'bika.read.preloadIamgeNumbers': 2,
    'bika.read.watchFullscreen': true,
    'bika.read.vertical': false,
    'bika.read.twoImage': false,
    'bika.read.rtl': false,
    'bika.read.imageQuality': <ImageQuality>'original',
    'bika.search.sort': 'dd' as SortType,
    'bika.search.fillerTags': new Array<FillerTag>(),
    'bika.search.showAIProject': true,
    "bika.proxy.interface": proxyData.interface[0],
    "bika.proxy.image": proxyData.image[0],
    "bika.proxy.db": proxyData.db[0],
    "bika.proxy.chat": proxyData.chat[0],
    'bika.subscribe.updateTime': dayjs().format("YYYY-MM-DD"),
    'bika.info.unsortComic': false,
    'bika.plusPlan': true,
    'bika.devMode': false,
    'bika.darkMode': false,
    'bika.game.search.fillerTags': new Array<FillerTag>(),
    'bika.smallWindow.enable': false,
    'bika.smallWindow.openOnQuit': false,
  }

  public static async getFromNet(config: AxiosRequestConfig = {}) {
    if (!id) return false
    return new UserConfig(defaultsDeep((await api.get<Res<RawUserConfig>>(`/${id}/setting`, config)).data.data, this.default))
  }

  public static async update(data: Partial<UserConfig>, config: AxiosRequestConfig = {}) {
    if (!id || isEmpty(data)) return false
    return new UserConfig((await api.put<Res<RawUserConfig>>(`/${id}/setting`, defaultsDeep(data, this.default), config)).data.data)
  }

  public static getFromDB() {
    return new UserConfig(defaultsDeep(JSON.parse(localStorage.getItem(symbol.config) ?? '{}'), this.default))
  }
}
export type RawUserConfig = typeof UserConfig.default

interface RawSubscribe {
  type: 'translater' | 'anthor' | 'uploader'
  id: string
  src?: string
  name: string
}
export class Subscribe {
  public type!: 'translater' | 'anthor' | 'uploader'
  public id!: string
  public src?: string
  public name!: string
  constructor(v: RawSubscribe) {
    setValue(this, v)
  }
  public static store
  static {
    this.store = {
      streams: shallowReactive(new Map<Subscribe, SearchStreamType>()),
      _subscribes: shallowReactive(new Array<Subscribe>()),
      set subscribes(v: Subscribe[]) {
        this._subscribes.splice(0, Infinity)
        this._subscribes.push(...v)
        console.log('change subscribes')
      },
      get subscribes() {
        return this._subscribes
      }
    }
    watch(this.store._subscribes, (subscribes: Subscribe[] /* <- 无法自动推断 */) => {
      const createStreamIfNon = (id: string, Constructor: new (id: string) => SearchStreamType) => searchResult.get(id) ?? new Constructor(id)
      for (const subscribe of subscribes) {
        let stream: SearchStreamType
        switch (subscribe.type) {
          case 'translater': stream = createStreamIfNon(subscribe.id, ComicStreamWithTranslater); break
          case 'anthor': stream = createStreamIfNon(subscribe.id, ComicStreamWithAuthor); break
          case 'uploader': stream = createStreamIfNon(subscribe.id, ComicStreamWithUploader); break
        }
        this.store.streams.set(subscribe, stream)
        // stream.next() // 用于进行更新判断
      }
    })
    this.get().then(v => {
      if (v) {
        this.store.subscribes = v
      }
    })
  }
  public static async get(config: AxiosRequestConfig = {}) {
    if (!id) return false
    const data = (await api.get<Res<RawSubscribe[]>>(`/${id}/subscribe`, config)).data.data
    if (data) return data.map(v => new Subscribe(v))
    return false
  }
  public static async add(data: Subscribe[], config: AxiosRequestConfig = {}) {
    if (!id || isEmpty(data)) return false
    const subscribes = (await api.patch<Res<RawSubscribe[]>>(`/${id}/subscribe`, data, config)).data.data.map(v => new Subscribe(v))
    Subscribe.store.subscribes = subscribes
    // const app = useAppStore()
    // app.$patch({ subscribes })
    return subscribes
  }
  public static async remove(data: string[], config: AxiosRequestConfig = {}) {
    if (!id || isEmpty(data)) return false
    const subscribes = (await api.delete<Res<RawSubscribe[]>>(`/${id}/subscribe?ids=${encodeURIComponent(JSON.stringify(data))}`, config)).data.data.map(v => new Subscribe(v))
    Subscribe.store.subscribes = subscribes
    // const app = useAppStore()
    // app.$patch({ subscribes })
    return subscribes
  }
}


const newUpdates = (() => {
  const newUpdates = axios.create()
  newUpdates.interceptors.request.use(async con => {
    con.baseURL = UserConfig.getFromDB()['bika.proxy.db']
    await until(isOnline).toBe(true)
    return con
  })
  newUpdates.interceptors.response.use(data => {
    data.data
    return data
  }, async err => {
    if (isCancel(err)) return Promise.reject(err)
    if (isObject(err?.request?.data)) return Promise.reject(err)
    if (!isAxiosError(err)) return Promise.reject(err)
    if (!err.config) return Promise.reject(err)
    if (err.config.retry && err.config.__retryCount && err.config.__retryCount >= err.config.retry) return errorReturn(err, err.message)
    err.config.__retryCount = err.config.__retryCount ?? 0
    err.config.__retryCount++
    if (err.response?.status == 404) err.config.url = `/${dayjs().add(-err.config.__retryCount, 'day').format(`YYYY-MM-DD`)}.data`
    await delay(3000)
    return newUpdates(err.config)
  })
  newUpdates.defaults.retry = 10 //重试次数
  return newUpdates
})()

interface RawYestdayUpdateComics {
  author: string
  categories: string
  chineseTeam: string
  created_at: string
  creator: string
  description: string
  epsCount: number
  fileServer: string
  finished: true
  id: string
  likesCount: number
  originalName: string
  pages: number
  path: string
  tags: string
  title: string
  title2: string
  totalLikes: number
  totalViews: number
  updated_at: string
}
export class YestdayUpdateComics{
  public author!: string
  public categories!: string
  public chineseTeam!: string
  public created_at!: string
  public creator!: string
  public description!: string
  public epsCount!: number
  public fileServer!: string
  public finished!: true
  public id!: string
  public likesCount!: number
  public originalName!: string
  public pages!: number
  public path!: string
  public tags!: string
  public title!: string
  public title2!: string
  public totalLikes!: number
  public totalViews!: number
  public updated_at!: string
  constructor(v: RawYestdayUpdateComics) {
    setValue(this, v)
  }
  public toProPlusComic() {
    return new ProPlusComic({
      _id: this.id,
      author: this.author,
      categories: this.categories.split(','),
      chineseTeam: this.chineseTeam,
      thumb: {
        fileServer: this.fileServer,
        originalName: this.originalName,
        path: this.path
      },
      tags: isFunction(this.tags.split) ? this.tags.split(',') : this.tags as any,
      created_at: this.created_at,
      description: this.description,
      finished: this.finished,
      likesCount: this.likesCount,
      title: this.title,
      totalLikes: this.totalLikes,
      totalViews: this.totalViews,
      updated_at: this.updated_at
    })
  }
  public static async getFromNet(config: AxiosRequestConfig = {}) {
    const news = await newUpdates.get<string>(`/${dayjs().format(`YYYY-MM-DD`)}.data`, config)
    const processd = news.data.split('\r\n').filter(Boolean).map(t => {
      try {
        const decodedWords = enc.Base64.parse(t)
        const decodedString = enc.Utf8.stringify(decodedWords)
        const jsonObject = JSON.parse(decodedString)
        return jsonObject
      } catch {}
    }).filter(Boolean).map(v => new YestdayUpdateComics(v))
    return processd.map(pdata => pdata.toProPlusComic())
  }
}
window.$api.enc = enc
export const getVer = async (config: AxiosRequestConfig = {}) => (await api.get<Res<string>>('/ver', config)).data.data