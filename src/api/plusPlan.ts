import config, { isOnline, type baseConfig } from '@/config'
import { useAppStore } from '@/stores'
import axios, { isAxiosError, isCancel, type AxiosRequestConfig } from 'axios'
import { HmacMD5, enc } from 'crypto-js'
import { fromPairs, isEmpty, isFunction,  isObject, isString, toPairs } from 'lodash-es'
import {  ProPlusComic, ProPlusMaxComic, type RawProComic, type RawProPlusMaxComic } from '.'
import { delay } from '@/utils/delay'
import { until, useLocalStorage } from '@vueuse/core'
import dayjs from 'dayjs'
import { errorReturn, setValue } from '@/utils/requset'
import symbol from '@/symbol'
export const api = (() => {
  const api = axios.create({
    baseURL: import.meta.env.DEV ? 'http://localhost:8787' : 'https://bika.wenxig.workers.dev',
    timeout: 10000,
  })
  api.interceptors.request.use(async v => {
    await until(isOnline).toBe(true)
    return v
  })
  api.interceptors.response.use(v => {
    if (config.value['bika.devMode']) {
      const app = useAppStore()
      const base = app.devData.get('plusApi') ?? {
        name: '华夏复兴计划api',
        data: []
      }
      base.data.push(v)
      app.devData.set('plusApi', base)
    }
    return v
  }, async err => {
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
  comic: string | RawProComic
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



export const getSearchHitory = async (config: AxiosRequestConfig = {}) => {
  if (!id) return false
  return (await api.get<Res<string[]>>(`/${id}/history/search`, config)).data.data
}
export const patchSearchHitory = async (data: string[], config: AxiosRequestConfig = {}) => {
  if (!id || isEmpty(data)) return false
  const app = useAppStore()
  return app.searchHistory = (await api.patch<Res<string[]>>(`/${id}/history/search`, data, config)).data.data
}

export const getConfig = async (config: AxiosRequestConfig = {}) => {
  if (!id) return false
  return (await api.get<Res<typeof baseConfig>>(`/${id}/setting`, config)).data.data
}

export const putConfig = async (data: typeof baseConfig, config: AxiosRequestConfig = {}) => {
  if (!id || isEmpty(data)) return false
  return (await api.put<Res<typeof baseConfig>>(`/${id}/setting`, data, config)).data.data
}

export const patchConfig = async (data: typeof baseConfig, config: AxiosRequestConfig = {}) => {
  if (!id || isEmpty(data)) return false
  return (await api.patch<Res<typeof baseConfig>>(`/${id}/setting`, data, config)).data.data
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
}
export const getSubscribe = async (config: AxiosRequestConfig = {}) => {
  if (!id) return false
  const data = (await api.get<Res<RawSubscribe[]>>(`/${id}/subscribe`, config)).data.data
  if (data) return data.map(v => new Subscribe(v))
  return false
}
export const patchSubscribe = async (data: Subscribe[], config: AxiosRequestConfig = {}) => {
  if (!id || isEmpty(data)) return false
  const subscribes = (await api.patch<Res<RawSubscribe[]>>(`/${id}/subscribe`, data, config)).data.data.map(v => new Subscribe(v))
  const app = useAppStore()
  app.$patch({ subscribes })
  return subscribes
}
export const removeSubscribe = async (data: string[], config: AxiosRequestConfig = {}) => {
  if (!id || isEmpty(data)) return false
  const subscribes = (await api.delete<Res<RawSubscribe[]>>(`/${id}/subscribe?ids=${encodeURIComponent(JSON.stringify(data))}`, config)).data.data.map(v => new Subscribe(v))
  const app = useAppStore()
  app.$patch({ subscribes })
  return subscribes
}


const newUpdates = (() => {
  const newUpdates = axios.create()
  newUpdates.interceptors.request.use(async con => {
    con.baseURL = config.value['bika.proxy.db']
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

interface RawNews {
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
class News {
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
  constructor(v: RawNews) {
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
}
export const getNewUpdatesComic = async (config?: AxiosRequestConfig) => {
  const news = await newUpdates.get<string>(`/${dayjs().format(`YYYY-MM-DD`)}.data`, config)
  const processd = news.data.split('\r\n').filter(Boolean).map(t => {
    const decodedWords = enc.Base64.parse(t)
    const decodedString = enc.Utf8.stringify(decodedWords)
    const jsonObject = JSON.parse(decodedString)
    return jsonObject
  }).map(v => new News(v))
  console.log(processd)

  return processd.map(pdata => pdata.toProPlusComic())
}

export const getVer = async (config: AxiosRequestConfig = {}) => (await api.get<Res<string>>('/ver', config)).data.data