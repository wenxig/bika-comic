import config, { isOnline } from '@/config'
import { useAppStore } from '@/stores'
import axios, { isCancel, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import { HmacMD5, enc } from 'crypto-js'
import { fromPairs, isEmpty, isFunction, isObject,  toPairs } from 'lodash-es'
import { ProPlusComic, ProPlusMaxComic, type RawProPlusMaxComic } from '.'
import { delay } from '@/utils/delay'
import { until } from '@vueuse/core'
import dayjs from 'dayjs'
const setValue = <T extends object>(v: T, v2: T) => {
  for (const key in v2) {
    const element = v2[key]
    v[key] = element
  }
}
const errorReturn = (err: any) => {
  try {
    window.$message.error('网络错误')
  } catch { }
  return Promise.reject(err)
}
export const api = (() => {
  const a = axios.create({
    baseURL: import.meta.env.DEV ? 'http://localhost:8787' : 'https://bika.wenxig.workers.dev',
    timeout: 10000,
  })
  a.interceptors.request.use(async v => {
    await until(isOnline).toBe(true)
    return v
  })
  a.interceptors.response.use(v => {
    if (config.value.devMode) {
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
    if (isObject(err?.request?.data)) return Promise.reject(err)
    if (isCancel(err)) return Promise.reject(err)
    if (/^[45]/g.test(<string>err?.request?.status?.toString())) return errorReturn(err)
    const config = err.config as InternalAxiosRequestConfig & { __retryCount: number, retry: number }
    if (config?.__retryCount && config.__retryCount >= config.retry) return errorReturn(err)
    config.__retryCount = config?.__retryCount ?? 0
    config.__retryCount++
    // 重新发起请求
    await delay(1000)
    return a(config)
  });
  (<any>a.defaults).retry = 10 //重试次数
  return a
})()
window.$api.plus = api
interface Res<T> {
  code: number,
  data: T
}
try {
  const userLogin = JSON.parse(localStorage.getItem('userLoginData')!)
  var id: string | null = HmacMD5(userLogin.email, userLogin.password).toString()
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
  public [0]!: string
  private comic!: ProPlusMaxComic
  public get [1](): ProPlusMaxComic {
    return this.comic
  }
  public set [1](v: RawProPlusMaxComic) {
    this.comic = new ProPlusMaxComic(v)
  }
  public [2]!: number
  public [3]!: number
  constructor(v: RawWatchHistory) {
    super(4)
    this[0] = v[0]
    this[1] = v[1]
    this[2] = v[2]
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
}
export class FavourtImage {
  public src!: string
  public time!: number
  public get date() {
    return new Date(this.time)
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
  return (await api.get<Res<Record<string, any>>>(`/${id}/setting`, config)).data.data
}

export const putConfig = async (data: Record<string, any>, config: AxiosRequestConfig = {}) => {
  if (!id || isEmpty(data)) return false
  return (await api.put<Res<Record<string, any>>>(`/${id}/setting`, data, config)).data.data
}

export const patchConfig = async (data: Record<string, any>, config: AxiosRequestConfig = {}) => {
  if (!id || isEmpty(data)) return false
  return (await api.patch<Res<Record<string, any>>>(`/${id}/setting`, data, config)).data.data
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


const newUpdates = axios.create()
newUpdates.interceptors.request.use(async con => {
  con.baseURL = config.value.proxy.db
  await until(isOnline).toBe(true)
  return con
})
newUpdates.interceptors.response.use(data => {
  data.data
  return data
}, async err => {
  if (isObject(err?.request?.data)) return Promise.reject(err)
  if (isCancel(err)) return Promise.reject(err)
  const config = err.config as InternalAxiosRequestConfig & { __retryCount: number, retry: number }
  if (config?.__retryCount && config.__retryCount >= config.retry) return errorReturn(err)
  config.__retryCount = config?.__retryCount ?? 0
  config.__retryCount++
  if (err?.response?.status == 404) {
    config.url = `/${dayjs().add(-config.__retryCount,'day').format(`YYYY-MM-DD`)}.data`
  }
  await delay(1000)
  return newUpdates(config)
});
(<any>newUpdates.defaults).retry = 10 //重试次数

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
  const processd = news.data.replaceAll('\r', '').split('\n').filter(Boolean).map(t => enc.Base64.parse(t).toString(enc.Utf8)).map(v => new News(JSON.parse(v)))
  return processd.map(pdata => pdata.toProPlusComic())
}

export const getVer = async (config: AxiosRequestConfig = {}) => (await api.get<Res<string>>('/ver', config)).data.data