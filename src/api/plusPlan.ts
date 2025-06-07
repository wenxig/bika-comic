const isOnline = useOnline()

import { useAppStore } from '@/stores'
import axios, { isAxiosError, isCancel, type AxiosRequestConfig } from 'axios'
import { HmacMD5, enc } from 'crypto-js'
import { fromPairs, isEmpty, isFunction, isObject, isString, toPairs } from 'lodash-es'
import { ComicStreamWithAuthor, ComicStreamWithTranslater, ComicStreamWithUploader, ProPlusComic, ProPlusMaxComic, type RawProComic, type RawProPlusComic, type RawProPlusMaxComic } from '.'
import { delay } from '@/utils/delay'
import { until, useLocalStorage, useOnline } from '@vueuse/core'
import { errorReturn, setValue } from '@/utils/requset'
import symbol from '@/symbol'
import { shallowReactive, watch } from 'vue'
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
export interface PlusServreRes<T> {
  code: number,
  data: T
}

export let plusId: string | null
const userLoginData = useLocalStorage(symbol.loginData, { email: '', password: '' })
try {
  const userLogin = userLoginData.value
  if (userLogin.email) plusId = HmacMD5(userLogin.email, userLogin.password).toString()
  else plusId = null
} catch {
  plusId = null
}

export const isInPlusPlan = async (config: AxiosRequestConfig = {}) => {
  if (!plusId) return false
  return (await api.get<PlusServreRes<boolean>>(`/${plusId}`, config)).data.data
}

export const joinInPlusPlan = async (config: AxiosRequestConfig = {}) => {
  if (await isInPlusPlan()) return true
  return (await api.put<PlusServreRes<boolean>>(`/${plusId}`, {}, config)).data.data
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
    console.log('set watch history comic', v?._id, v,this.v)

    this.comic = new ProPlusMaxComic(v)
  }
  /** @description 观看页数 */ public [2]!: number
  /** @description 观看时间 */ public [3]!: number
  constructor(private v: RawWatchHistory) {
    super(4)
    if (v[1] instanceof String){
      // is base64
      try {
        const decodedWords = enc.Base64.parse(<string>v[1])
        const decodedString = enc.Utf8.stringify(decodedWords)
        v[1] = JSON.parse(decodedString) as RawProPlusMaxComic
      } catch (e) {
        console.error('Failed to decode watch history comic', e)
        v[1] = {} as RawProPlusMaxComic // fallback to empty object if parsing fails
      }
    }
    this[0] = v[0]
    this[1] = v[1]
    this[2] = v[2] + 1
    this[3] = v[3]
  }
}

export const getWatchHitory = async (config: AxiosRequestConfig = {}) => {
  if (!plusId) return false
  return fromPairs(toPairs((await api.get<PlusServreRes<Record<string, RawWatchHistory>>>(`/${plusId}/history/watch`, config)).data.data).map(([k, v]) => [k, new WatchHistory(v)]))
}

export const patchWatchHitory = async (data: Record<string, WatchHistory>, config: AxiosRequestConfig = {}) => {
  if (!plusId || isEmpty(data)) return false
  return fromPairs(toPairs((await api.patch<PlusServreRes<Record<string, RawWatchHistory>>>(`/${plusId}/history/watch`, data, config)).data.data).map(([k, v]) => [k, new WatchHistory(v)]))
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
  if (!plusId) return false
  const data = (await api.get<PlusServreRes<RawFavourtImage[]>>(`/${plusId}/favourt/image`, config)).data.data
  if (!data) return
  return data.map(v => new FavourtImage(v))
}

export const putFavourtImages = async (data: FavourtImage[], config: AxiosRequestConfig = {}) => {
  return (await api.put<PlusServreRes<RawFavourtImage[]>>(`/${plusId}/favourt/image`, data, config)).data.data.map(v => new FavourtImage(v))
}

export const patchFavourtImages = async (data: FavourtImage[], config: AxiosRequestConfig = {}) => {
  if (!plusId || isEmpty(data)) return false
  return (await api.patch<PlusServreRes<RawFavourtImage[]>>(`/${plusId}/favourt/image`, data, config)).data.data.map(v => new FavourtImage(v))
}

export class SearchHistory extends String {
  public static async get(config: AxiosRequestConfig = {}) {
    if (!plusId) return false
    const res = await api.get<PlusServreRes<string[]>>(`/${plusId}/history/search`, config)
    return res.data.data.map(v => new SearchHistory(v))
  }
  public static async patch(data: string[], config: AxiosRequestConfig = {}) {
    if (!plusId || isEmpty(data)) return false
    const app = useAppStore()
    const res = await api.patch<PlusServreRes<string[]>>(`/${plusId}/history/search`, data, config)
    app.searchHistory = res.data.data.map(v => new SearchHistory(v))
    return app.searchHistory
  }
}


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
        console.log('change subscribes', v)
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
    if (!plusId) return false
    const data = (await api.get<PlusServreRes<RawSubscribe[]>>(`/${plusId}/subscribe`, config)).data.data
    if (data) return data.map(v => new Subscribe(v))
    return false
  }
  public static async add(data: Subscribe[], config: AxiosRequestConfig = {}) {
    if (!plusId || isEmpty(data)) return false
    const subscribes = (await api.patch<PlusServreRes<RawSubscribe[]>>(`/${plusId}/subscribe`, data, config)).data.data.map(v => new Subscribe(v))
    Subscribe.store.subscribes = subscribes
    // const app = useAppStore()
    // app.$patch({ subscribes })
    return subscribes
  }
  public static async remove(data: string[], config: AxiosRequestConfig = {}) {
    if (!plusId || isEmpty(data)) return false
    const subscribes = (await api.delete<PlusServreRes<RawSubscribe[]>>(`/${plusId}/subscribe?ids=${encodeURIComponent(JSON.stringify(data))}`, config)).data.data.map(v => new Subscribe(v))
    Subscribe.store.subscribes = subscribes
    // const app = useAppStore()
    // app.$patch({ subscribes })
    return subscribes
  }
}



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
export class YestdayUpdateComics {
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
  public static async getFromNet(_config: AxiosRequestConfig = {}) {
    // bot挂了

    // const news = await newUpdates.get<string>(`/${dayjs().format(`YYYY-MM-DD`)}.data`, config)
    // const processd = news.data.split('\r\n').filter(Boolean).map(t => {
    //   try {
    //     const decodedWords = enc.Base64.parse(t)
    //     const decodedString = enc.Utf8.stringify(decodedWords)
    //     const jsonObject = JSON.parse(decodedString)
    //     return jsonObject
    //   } catch {}
    // }).filter(Boolean).map(v => new YestdayUpdateComics(v))
    return [] // processd.map(pdata => pdata.toProPlusComic())
  }
}
window.$api.enc = enc
export const getVer = async (config: AxiosRequestConfig = {}) => (await api.get<PlusServreRes<string>>('/ver', config)).data.data