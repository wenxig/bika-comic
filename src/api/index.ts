import axios, { type AxiosRequestConfig, isCancel, type AxiosResponse, isAxiosError } from 'axios'
import { max, times, uniqBy, flatten, sortBy, values, isEmpty, isFunction } from 'lodash-es'
import { computed, ref, shallowRef, triggerRef, type Ref } from 'vue'
import { spiltAnthors, toCn, toTw } from '@/utils/translater'
import config, { isOnline } from '@/config'
import { SmartAbortController, errorReturn, setValue } from '@/utils/requset'
import { HmacSHA256, enc } from "crypto-js"
import { delay } from '@/utils/delay'
import { RawImage, Image } from '@/utils/image'
import { useAppStore } from '@/stores'
import { until, useLocalStorage } from '@vueuse/core'
import { createLoadingMessage, createDialog } from '@/utils/message'
import symbol from '@/symbol'
import localforage from 'localforage'
import eventBus from '@/utils/eventBus'
import proxyJson from './proxy.json'
export { type RawImage, Image } from '@/utils/image'
const createClass = <T extends Result<any>, C>(v: T, Class: new (data: T['docs'][number]) => C): Result<C> => {
  v.docs = v.docs.map(v => new Class(v))
  return v
}

export function getBikaApiHeaders(pathname: string, method: string) {
  type Headers = [name: string, value: string][]
  pathname = pathname.substring(1)
  const requestTime = (new Date().getTime() / 1000).toFixed(0)
  let nonce = localStorage.getItem(symbol.loginNonce)
  if (!nonce) {
    const chars = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678"
    nonce = Array.from({ length: 32 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('').toLowerCase()
    localStorage.setItem(symbol.loginNonce, nonce)
  }
  const rawSignature = `${pathname}${requestTime}${nonce}${method}C69BAF41DA5ABD1FFEDC6D2FEA56B`.toLowerCase()
  const headers: Headers = [
    ['app-channel', '1'],
    ['app-uuid', 'webUUID'],
    ['accept', 'application/vnd.picacomic.com.v1+json'],
    ['app-platform', 'android'],
    ['Content-Type', 'application/json; charset=UTF-8'],
    ['time', requestTime],
    ['nonce', nonce],
    ['image-quality', config.value["bika.read.imageQuality"]],
    ['signature', HmacSHA256(rawSignature, '~d}$Q7$eIni=V)9\\RK/P.RM4;9[7|@/CA}b~OW!3?EV`:<>M7pddUBL5n|0/*Cn').toString(enc.Hex)],
    ['Raw-Signature', rawSignature]
  ]
  const token = localStorage.getItem(symbol.loginToken)
  if (token) headers.push(['authorization', token])
  return headers
}


const userLoginData = useLocalStorage(symbol.loginData, { email: '', password: '' })
eventBus.on('networkError_unauth', () => {
  localStorage.removeItem(symbol.loginToken)
})
export interface Result<T> {
  docs: T[]
  limit: number
  page: string | number
  pages: number
  total: number
}
export interface RawData<T> {
  message: string,
  code: number,
  data: T,
  error?: string
}


const getInterfaceConfig = () => proxyJson.interface.find(v => v.url == config.value['bika.proxy.interface']) ?? {
  url: config.value['bika.proxy.interface'],
  recommendPart: 'recommend',
  basePart: 'api'
}

export const api = (() => {
  const api = axios.create({
    baseURL: '',
    adapter: ["fetch", "xhr", "http"],
    timeout: 5000
  })
  api.interceptors.request.use(async requestConfig => {
    if (values(requestConfig.data).includes(undefined)) throw Promise.reject('some values is undefined')
    const baseInterface = getInterfaceConfig()
    requestConfig.baseURL = `https://${baseInterface.basePart}.${baseInterface.url}`
    await until(isOnline).toBe(true)
    for (const value of getBikaApiHeaders(requestConfig.url ?? '/', requestConfig.method!.toUpperCase())) requestConfig.headers.set(...value)
    return requestConfig
  })
  const handleError = async (err: any) => {
    await delay(3000)
    if (isCancel(err) || !isAxiosError<RawData<{ error: string }>>(err)) return Promise.reject(err)

    if (err?.response?.status == 401) {
      if (userLoginData.value.email) {
        localStorage.setItem(symbol.loginToken, (await login(userLoginData.value)).data.data.token)
        if (err.config) for (const value of getBikaApiHeaders(err.config.url ?? '/', err.config.method!.toUpperCase())) err.config.headers.set(...value)
        return api(err.config ?? {})
      } else if (!location.pathname.includes('auth')) {
        eventBus.emit('networkError_unauth')
        return Promise.reject(err)
      }
    }
    if (err?.response?.status.toString().startsWith('4')) {
      return Promise.reject(err)
    }

    if (err?.response && err.response.data.error == '1014') return Promise.resolve((<AxiosResponse>{ data: false, config: err.config, headers: err.response?.headers, status: 200, statusText: '200', request: err.request })) // only /comic/:id

    if (!err.config) return errorReturn(err, err.message)
    if (err.config.__retryCount && err.config.retry && err.config.__retryCount >= err.config.retry) return errorReturn(err, err?.response?.data.message ?? err.message)
    err.config.__retryCount = err.config?.__retryCount ?? 0
    err.config.__retryCount++
    for (const value of getBikaApiHeaders(err.config.url ?? '/', err.config.method!.toUpperCase())) err.config.headers.set(...value)
    return api(err.config)
  }
  api.interceptors.response.use(async v => {
    if (!v.data.data) {
      await delay(3000)
      if (["/", ''].includes(v.config.url ?? '')) return v

      if (/post/ig.test(v.config.method ?? '')) return v

      if (v.config.url?.includes('/users/profile') && /put/ig.test(v.config.method ?? '')) return v
      if (true) return errorReturn(v.data, '异常数据返回')
    }
    return v
  }, handleError)
  api.defaults.retry = 10 //重试次数
  return api
})()
window.$api.api = api

export const recommendApi = (() => {
  const api = axios.create({
    baseURL: '',
    adapter: ["fetch", "xhr", "http"],
    timeout: 5000
  })
  api.interceptors.request.use(async requestConfig => {
    if (values(requestConfig.data).includes(undefined)) throw Promise.reject('some values is undefined')
    const baseInterface = getInterfaceConfig()
    requestConfig.baseURL = `https://${baseInterface.recommendPart}.${baseInterface.url}`
    await until(isOnline).toBe(true)
    for (const value of getBikaApiHeaders(requestConfig.url ?? '/', requestConfig.method!.toUpperCase())) requestConfig.headers.set(...value)
    return requestConfig
  })
  const handleError = async (err: any) => {
    await delay(3000)
    if (isCancel(err) || !isAxiosError(err)) return Promise.reject(err)
    if (!err.config) return errorReturn(err, err.message)
    if (err.config.__retryCount && err.config.retry && err.config.__retryCount >= err.config.retry) return errorReturn(err, err?.response?.data.message ?? err.message)
    err.config.__retryCount = err.config?.__retryCount ?? 0
    err.config.__retryCount++
    for (const value of getBikaApiHeaders(err.config.url ?? '/', err.config.method!.toUpperCase())) err.config.headers.set(...value)
    return api(err.config)
  }
  api.interceptors.response.use(async v => {
    if (!v.data.data) {
      await delay(3000)
      if (true) return errorReturn(v.data, '异常数据返回')
    }
    return v
  }, handleError)
  api.defaults.retry = 10 //重试次数
  return api
})()
window.$api.api = api

export const punch = (config: AxiosRequestConfig = {}) => api.post('/users/punch-in', undefined, config)
punch()
export abstract class Comic {
  public isLiked?: boolean
  public isFavourite?: boolean
  public likesCount?: number
  public picId: Promise<number>
  public toJSON() {
    const keys = <(keyof this)[]>Object.keys(this).map(v => {
      if (v.startsWith('__')) return v.substring(1)

      if (v.startsWith('_$')) return v.substring(2)
      return v
    })
    const obj: any = {}
    for (const key of keys) isFunction(this[key]) || (obj[key] = this[key])
    delete obj.picId
    return obj
  }
  public async like(config: AxiosRequestConfig = {}, message = true) {
    console.log('change comic like', this.isLiked, this.likesCount, this)
    if (message) var loading = createLoadingMessage(this.isFavourite ? '取消中' : '点赞中')
    try {
      const ret = await likeComic(this._id, config)
      if ('isLiked' in this) this.isLiked = !this.isLiked
      if ('likesCount' in this) if (ret == 'like') this.likesCount!++
      else this.likesCount!--
      if (loading!) loading.success()
    } catch {
      if (loading!) loading.fail()
    }
  }
  public async favourt(config: AxiosRequestConfig = {}, message = true) {
    console.log('change comic favourt', this.isFavourite, this)
    if (message) var loading = createLoadingMessage(this.isFavourite ? '删除中' : '收藏中')
    try {
      await favouriteComic(this._id, config)
      if ('isFavourite' in this) this.isFavourite = !this.isFavourite
      const app = useAppStore()
      if (message) {
        app.user()?.favourite.reload()
        await app.user()?.favourite.next()
      }
      if (loading!) loading.success()
    } catch {
      if (loading!) loading.fail()
    }
  }
  private __info?: ProPlusMaxComic
  public async getInfo(config: AxiosRequestConfig = {}) {
    if (this.__info) return this.__info
    const info = await getComicInfo(this._id, config)
    if (info) return this.__info = info
    else return undefined
  }
  constructor(public _id: string) {
    this.picId = getComicPicId(_id)
  }
}
export interface RawProComic {
  _id: string
  title: string
  author: string
  totalViews: number
  totalLikes: number
  pagesCount: number
  epsCount: number
  finished: boolean
  categories: string[]
  thumb: RawImage
  likesCount: number
}
export class ProComic extends Comic {
  public title!: string
  public author!: string
  public totalViews!: number
  public totalLikes!: number
  public pagesCount!: number
  public epsCount!: number
  public finished!: boolean
  public categories!: string[]
  private _$thumb?: Image
  public get thumb() {
    return this._$thumb!
  }
  public set thumb(v) {
    this._$thumb = new Image(v)
  }
  declare public likesCount: number
  constructor(v: RawProComic) {
    super(v._id)
    setValue(this, v)
  }
};

export interface RawProPlusComic {
  updated_at: string
  thumb: RawImage
  author: string
  description: string
  chineseTeam: string
  created_at: string
  finished: boolean
  totalViews: number
  categories: string[]
  totalLikes: number
  title: string
  tags: string[]
  _id: string
  likesCount: number
}
export class ProPlusComic extends Comic {
  public updated_at!: string
  public get updated_time() {
    return new Date(this.updated_at)
  }
  private _$thumb?: Image
  public get thumb() {
    return this._$thumb!
  }
  public set thumb(v) {
    this._$thumb = new Image(v)
  }
  public author!: string
  public description!: string
  public chineseTeam!: string
  public created_at!: string
  public get created_time() {
    return new Date(this.created_at)
  }
  public finished!: boolean
  public totalViews!: number
  public categories!: string[]
  public totalLikes!: number
  public title!: string
  public tags!: string[]
  declare public likesCount: number
  constructor(v: RawProPlusComic) {
    super(v._id)
    setValue(this, v)
  }
}

export interface RawProPlusMaxComic {
  _id: string
  _creator: RawUser
  title: string
  description: string
  thumb: RawImage
  author: string
  chineseTeam: string
  categories: HotTag[]
  tags: string[]
  pagesCount: number
  epsCount: number
  finished: boolean
  updated_at: string
  created_at: string
  allowDownload: boolean
  allowComment: boolean
  totalLikes: number
  totalViews: number
  totalComments: number
  viewsCount: number
  likesCount: number
  commentsCount: number
  isFavourite: boolean
  isLiked: boolean
}
export class ProPlusMaxComic extends Comic {
  private __creator?: User
  public get _creator() {
    return this.__creator!
  }
  public set _creator(v) {
    this.__creator = new User(v)
  }
  public title!: string
  public description!: string
  private _$thumb?: Image
  private _thumb?: Image
  public get thumb() {
    return this._$thumb ?? this._thumb!
  }
  public set thumb(v) {
    this._$thumb = new Image(v)
  }
  public author!: string
  public chineseTeam!: string
  public categories!: HotTag[]
  public tags!: string[]
  public pagesCount!: number
  public epsCount!: number
  public finished!: boolean
  public updated_at!: string
  public get updated_time() {
    return new Date(this.updated_at)
  }
  public created_at!: string
  public get created_time() {
    return new Date(this.created_at)
  }
  public allowDownload!: boolean
  public allowComment!: boolean
  public totalLikes!: number
  public totalViews!: number
  public totalComments!: number
  public viewsCount!: number
  declare public likesCount: number
  public commentsCount!: number
  declare public isFavourite: boolean
  declare public isLiked: boolean
  constructor(v: RawProPlusMaxComic) {
    super(v._id)
    setValue(this, v)
  }
}
export const getComicsIn = async (type: string, searchTag = '', config: AxiosRequestConfig = {}) => (await api.get<RawData<{ comics: RawProComic[] }>>(`/comics/${type}${searchTag}`, config)).data.data.comics.map(v => new ProComic(v))

interface RawCollection {
  comics: RawProComic[]
  title: string
}
export class Collection {
  private _comics!: ProComic[]
  public set comics(v: RawProComic[]) {
    this._comics = v.map(v => new ProComic(v))
  }
  public get comics(): ProComic[] {
    return this._comics
  }
  public title!: string
  constructor(v: RawCollection) {
    setValue(this, v)
  }
  public static async getFromNet(config: AxiosRequestConfig = {}) {
    const res = await api.get<RawData<{ collections: RawCollection[] }>>("/collections", config)
    return res.data.data.collections.map(v => new Collection(v))
  }
}

interface RawCategories {
  title: string
  thumb: RawImage
  isWeb: boolean
  active: boolean
  link?: string
}
export class Categories {
  public title!: string
  private _thumb?: Image
  public get thumb() {
    return this._thumb!
  }
  public set thumb(v) {
    this._thumb = new Image(v)
  }
  public isWeb!: boolean
  public active!: boolean
  public link?: string
  constructor(v: RawCategories) {
    setValue(this, v)
  }
  public static async getFromNet(config: AxiosRequestConfig = {}) {
    const res = await api.get<RawData<{ categories: RawCategories[] }>>("/categories", config)
    return res.data.data.categories.map(v => new Categories(v))
  }
}

export class HotTag extends String {
  public static async getFromNet(config: AxiosRequestConfig = {}) {
    const res = await api.get<RawData<{ keywords: string[] }>>("/keywords", config)
    return res.data.data.keywords.map(v => new HotTag(v))
  }
}

export type SearchResult<T = RawProPlusComic> = Result<T>


export interface Stream<T> {
  docs: Ref<T[]>
  pages: Ref<number>
  total: Ref<number>
  page: Ref<number>
  done: Ref<boolean>
  isRequesting: Ref<boolean>
  next(): Promise<void | undefined>
  reload(text?: string, sort?: SortType): void
  stop(): void
  isErr: Ref<boolean>
  errCause: Ref<string | undefined>
  retry(): Promise<void | undefined>
}

export interface ComicStreamI<T = ProPlusComic> extends Stream<T> {
  sort: SortType
}
export abstract class ComicStream<T = ProPlusComic> implements ComicStreamI<T> {
  protected stopC = new SmartAbortController()
  public docs = shallowRef<T[]>([])
  protected addValue(value: T[]) {
    this.docs.value.push(...value)
    triggerRef(this.docs)
  }
  public constructor(protected tag: string, public sort: SortType = 'dd', protected getDataFunction?: (keyword: string, page: number, sort: SortType, config?: AxiosRequestConfig) => Promise<Result<T>>) { }
  public pages = shallowRef(NaN)
  public total = computed(() => this.docs.value.length)
  public page = shallowRef(0)
  public done = computed(() => this.page.value >= this.pages.value)
  public isRequesting = shallowRef(false)
  public reload(tag?: string, sort?: SortType) {
    this.tag = tag || this.tag
    this.sort = sort || this.sort
    this.pages.value = NaN
    this.page.value = 0
    this.docs.value = []
  }

  public async next() {
    if (this.isRequesting.value) return
    this.isRequesting.value = true
    try {
      if (!this.getDataFunction) return void (this.isRequesting.value = false)
      this.page.value++
      const data = await this.getDataFunction(this.tag, this.page.value, this.sort, { signal: this.stopC.signal })
      this.pages.value = data.pages
      this.addValue(data.docs)
      this.isErr.value = false
      this.errCause.value = undefined
    } catch (err) {
      this.isErr.value = true
      if (err instanceof Error) this.errCause.value = err.message || err.name
    }
    this.isRequesting.value = false
  }
  public isErr = shallowRef(false)
  public errCause = shallowRef<string>()
  public async retry() {
    if (!this.isErr.value) return
    this.page.value--
    return this.next()
  }
  public stop() {
    this.stopC.abort()
  }
}
export class RandomComicStream extends ComicStream<ProComic> {
  protected stopC = new SmartAbortController()
  public docs = shallowRef<ProComic[]>([])
  protected addValue(value: ProComic[]) {
    this.docs.value.push(...value)
    triggerRef(this.docs)
  }
  constructor() {
    super('')
  }
  public pages = shallowRef(NaN)
  public total = computed(() => this.docs.value.length)
  public page = shallowRef(0)
  public done = computed(() => this.page.value >= this.pages.value)
  public isRequesting = shallowRef(false)
  public reload() {
    this.pages.value = NaN
    this.page.value = 0
    this.docs.value = []
  }
  public async next(): Promise<undefined> {
    if (this.isRequesting.value) return
    this.isRequesting.value = true
    try {
      this.page.value++
      const data = await getComicsIn('random', undefined, { signal: this.stopC.signal })
      this.pages.value = Infinity
      this.addValue(data)
      this.isErr.value = false
      this.errCause.value = undefined
    } catch (err) {
      this.isErr.value = true
      if (err instanceof Error) this.errCause.value = err.message || err.name
    }
    this.isRequesting.value = false
  }
  public stop() {
    this.stopC.abort()
  }
}
export type ResultOfSearch = Pick<SearchResult, 'docs' | 'total'>
export const searchComics = async (keyword: string, page = 1, sort: SortType = 'dd', config: AxiosRequestConfig = {}): Promise<SearchResult<ProPlusComic>> => {
  const twTag = toTw(keyword)
  const cnTag = toCn(keyword)
  if (twTag == cnTag) var data_TW: SearchResult<RawProPlusComic> = { docs: [], pages: 0, limit: 0, page: 0, total: 0 }, { data: { data: { comics: data_CN } } } = await api.post<RawData<{ comics: SearchResult }>>(`/comics/advanced-search?page=${page}&sort=${sort}`, { keyword: cnTag, sort }, config)
  else var /** 程序猿的千重解构 */[{ data: { data: { comics: data_TW } } }, { data: { data: { comics: data_CN } } }] = await Promise.all([
    api.post<RawData<{ comics: SearchResult }>>(`/comics/advanced-search?page=${page}&sort=${sort}`, { keyword: twTag, sort }, config),
    api.post<RawData<{ comics: SearchResult }>>(`/comics/advanced-search?page=${page}&sort=${sort}`, { keyword: cnTag, sort }, config)
  ])
  const data = uniqBy(data_TW.docs.concat(data_CN.docs), v => v._id).map(v => new ProPlusComic(v))
  return {
    docs: data,
    total: data.length,
    limit: NaN,
    page,
    pages: max([data_TW.pages, data_CN.pages])!
  }
}
export class ComicStreamWithKeyword extends ComicStream {
  public docs = shallowRef<ProPlusComic[]>([])
  protected addValue(value: RawProPlusComic[]) {
    this.docs.value.push(...value.map(v => new ProPlusComic(v)))
    this.docs.value = uniqBy(this.docs.value, v => v._id)
    triggerRef(this.docs)
  }
  constructor(public keyword: string, public sort: SortType = 'dd') {
    super(keyword, sort)
  }
  private cnPages = shallowRef(NaN)
  private twPages = shallowRef(NaN)
  public pages = computed(() => max([this.cnPages.value, this.twPages.value])!)
  public total = computed(() => this.docs.value.length)
  public page = shallowRef(0)
  public done = computed(() => this.page.value >= this.pages.value)
  public isRequesting = shallowRef(false)
  public async next(): Promise<undefined> {
    if (this.isRequesting.value) return
    this.page.value++
    const pl = new Array<Promise<any>>()
    if (isNaN(this.twPages.value) || this.twPages.value > this.page.value) {
      this.isRequesting.value = true
      pl.push(api.post<RawData<{ comics: SearchResult }>>(`/comics/advanced-search?page=${this.page.value}&sort=${this.sort}`, { keyword: toTw(this.keyword), sort: this.sort }, { signal: this.stopC.signal }).then(v => {
        this.twPages.value = v.data.data.comics.pages
        this.addValue(v.data.data.comics.docs)
      }))
    }
    if (isNaN(this.cnPages.value) || this.cnPages.value > this.page.value) {
      this.isRequesting.value = true
      pl.push(api.post<RawData<{ comics: SearchResult }>>(`/comics/advanced-search?page=${this.page.value}&sort=${this.sort}`, { keyword: toCn(this.keyword), sort: this.sort }, { signal: this.stopC.signal }).then(v => {
        this.cnPages.value = v.data.data.comics.pages
        this.addValue(v.data.data.comics.docs)
      }))
    }
    try {
      await Promise.all(pl)
      this.isErr.value = false
      this.errCause.value = undefined
    } catch (err) {
      this.isErr.value = true
      if (err instanceof Error) this.errCause.value = err.message || err.name
    }
    this.isRequesting.value = false
  }
  public reload(tag?: string, sort?: SortType) {
    this.tag = tag || this.tag
    this.sort = sort || this.sort
    this.page.value = 0
    this.cnPages.value = this.twPages.value = NaN
    this.docs.value = []
  }
}

export const searchComicsWithAuthor = async (author: string, page = 1, sort: SortType = 'dd', config: AxiosRequestConfig = {}) => {
  const data = await searchComics(author, page, sort, config)
  data.docs = data.docs.filter(v => spiltAnthors(v.author).includes(author.trim()))
  return data
}
export class ComicStreamWithAuthor extends ComicStream {
  constructor(public author: string, sort: SortType = 'dd') { super(author, sort, searchComicsWithAuthor) }
}


export const searchComicsWithTranslater = async (translater: string, page = 1, sort: SortType = 'dd', config: AxiosRequestConfig = {}) => {
  const data = await searchComics(translater, page, sort, config)
  data.docs = data.docs.filter(v => v.chineseTeam == translater)
  return data
}
export class ComicStreamWithTranslater extends ComicStream {
  constructor(public translater: string, sort: SortType = 'dd') { super(translater, sort, searchComicsWithTranslater) }
}

export const searchComicsWithUploader = async (id: string, page = 1, sort: SortType = 'dd', config: AxiosRequestConfig = {}) => createClass((await api.get<RawData<{ comics: SearchResult<RawProComic> }>>(`/comics?page=${page}&ca=${id}&s=${sort}`, config)).data.data.comics, ProComic)
export class ComicStreamWithUploader extends ComicStream<ProComic> {
  constructor(public id: string, sort: SortType = 'dd') { super(id, sort, searchComicsWithUploader) }
}
export const searchComicsWithCategories = async (categorie: string, page = 1, sort: SortType = 'dd', config: AxiosRequestConfig = {}) => createClass((await api.get<RawData<{ comics: SearchResult<RawProComic> }>>(`/comics?page=${page}&c=${encodeURIComponent(categorie)}&s=${sort}`, config)).data.data.comics, ProComic)
export class ComicStreamWithCategories extends ComicStream<ProComic> {
  constructor(public categorie: string, sort: SortType = 'dd') { super(categorie, sort, searchComicsWithCategories) }
}

export const searchComicsWithTag = async (tag: string, page = 1, sort: SortType = 'dd', config: AxiosRequestConfig = {}) => createClass((await api.get<RawData<{ comics: SearchResult<RawProComic> }>>(`/comics?page=${page}&t=${encodeURIComponent(tag)}&s=${sort}`, config)).data.data.comics, ProComic)
export class ComicStreamWithTag extends ComicStream<ProComic> {
  constructor(tag: string, sort: SortType = 'dd') { super(tag, sort, searchComicsWithTag) }
}

export const getComicPicId = async (id: string, config: AxiosRequestConfig = {}) => {
  const result = await recommendApi.get<{ shareId: number }>(`/pic/share/set/?c=${id}`, config)
  const picId = result.data.shareId
  return picId
}
export const getComicIdFromPicId = async (picid: number, config: AxiosRequestConfig = {}) => {
  const result = await recommendApi.get<{ cid: string }>(`/pic/share/get/?shareId=${picid}`, config)
  const id = result.data.cid
  return id
}
export const getComicFromPicId = async (picid: number, config: AxiosRequestConfig = {}) => {
  const id = await getComicIdFromPicId(picid, config)
  const data = await getComicInfo(id, config)
  return data
}
export class ComicStreamWithPicId extends ComicStream<ProPlusMaxComic> {
  constructor(picId: number, sort: SortType = 'dd') { super(picId.toString(), sort) }
  public async next() {
    if (this.isRequesting.value) return
    this.isRequesting.value = true
    try {
      const data = await getComicFromPicId(Number(this.tag), { signal: this.stopC.signal })
      if (!data) return void (this.isRequesting.value = false)
      this.pages.value = 1
      this.addValue([data])
      this.isErr.value = false
      this.errCause.value = undefined
    } catch (err) {
      this.pages.value = 1
      this.docs.value = []
      this.isErr.value = true
      if (err instanceof Error) this.errCause.value = err.message || err.name
    }
    this.isRequesting.value = false
  }
  public done = computed(() => this.docs.value.length == 1)
}

export class ComicStreamWithId extends ComicStream<ProPlusMaxComic> {
  constructor(id: string, sort: SortType = 'dd') { super(id, sort) }
  public async next() {
    if (this.isRequesting.value) return
    this.isRequesting.value = true
    try {
      const data = await getComicInfo(this.tag, { signal: this.stopC.signal })
      if (!data) return void (this.isRequesting.value = false)
      this.pages.value = 1
      this.addValue([data])
      this.isErr.value = false
      this.errCause.value = undefined
    } catch (err) {
      this.pages.value = 1
      this.docs.value = []
      this.isErr.value = true
      if (err instanceof Error) this.errCause.value = err.message || err.name
    }
    this.isRequesting.value = false
  }
  public done = computed(() => this.docs.value.length == 1)
}

export class ComicStreamWithNoop extends ComicStream {
  constructor(id: string, sort: SortType = 'dd') { super(id, sort) }
  public async next(): Promise<undefined> {
    this.docs.value = []
    this.pages.value = 1
  }
  public done = computed(() => true)
}
interface RawCommenUser {
  _id: string
  gender: UserSex
  name: string
  verified: boolean
  exp: number
  level: number
  characters: string[]
  role?: string
  title: string
  slogan: string

}
export interface CommenUser extends RawCommenUser {

  get id(): string
  get avatar(): Image
  set avatar(v: Image)
}

export type UserSex = 'f' | 'm' | 'bot'
interface RawUser {
  _id: string
  gender: UserSex
  name: string
  verified: boolean
  exp: number
  level: number
  characters: string[]
  role?: string
  avatar: RawImage
  title: string
  slogan: string
}
export class User implements CommenUser {
  public _id!: string
  public gender!: UserSex
  public name!: string
  public verified!: boolean
  public exp!: number
  public level!: number
  public characters!: string[]
  public role?: string
  private _avatar?: Image
  public get id() {
    return this._id
  }
  public get avatar() {
    return this._avatar!
  }
  public set avatar(v) {
    this._avatar = new Image(v)
  }
  public title!: string
  public slogan!: string
  constructor(v: RawUser) {
    setValue(this, v)
  }
}

interface RawUserProfile {
  _id: string
  birthday: string
  email: string
  gender: UserSex
  name: string
  slogan: string
  title: string
  verified: boolean
  exp: number
  level: number
  characters: string[]
  created_at: string
  avatar: RawImage
  isPunched: boolean
}
export class UserProfile implements CommenUser {
  public _id!: string
  public birthday!: string
  public email!: string
  public gender!: UserSex
  private _avatar?: Image
  public name!: string
  public slogan!: string
  public title!: string
  public verified!: boolean
  public exp!: number
  public level!: number
  public characters!: string[]
  public created_at!: string
  public get created_time() {
    return new Date(this.created_at)
  }
  public get avatar() {
    return this._avatar!
  }
  public set avatar(v) {
    this._avatar = new Image(v)
  }
  public isPunched!: boolean
  constructor(v: RawUserProfile) {
    setValue(this, v)
  }
  get id() {
    return this._id
  }
  role?: string | undefined
}


const infoStore = new Map<string, ProPlusMaxComic | false>()
export const getComicInfo = async (id: string, config: AxiosRequestConfig = {}) => {
  if (infoStore.has(id)) return infoStore.get(id)!
  const data = (await api.get<RawData<{ comic: RawProPlusMaxComic } | false>>(`/comics/${id}`, config)).data.data
  if (data) infoStore.set(id, new ProPlusMaxComic(data.comic))
  else infoStore.set(id, false)
  return infoStore.get(id)!
}

interface RawEp {
  _id: string
  title: string
  order: number
  updated_at: number
  id: string
}
export class Ep {
  public _id!: string
  public title!: string
  public order!: number
  public updated_at!: number
  public get updated_time() {
    return new Date(this.updated_at)
  }
  public id!: string
  constructor(v: RawEp) {
    setValue(this, v)
  }
}
type Eps = Result<RawEp>
export type ComicEps = Ep[] & {
  id?: string
}
export const getComicEps = (async (id: string, config: AxiosRequestConfig = {}): Promise<ComicEps> => {
  const ep = new Array<Eps>()
  const baseEps = (await api.get<RawData<{ eps: Eps }>>(`/comics/${id}/eps?page=1`)).data.data.eps
  ep.push(baseEps)
  await Promise.all(times(baseEps.pages - 1, async i => ep.push((await api.get<RawData<{ eps: Eps }>>(`/comics/${id}/eps?page=${i + 2}`, config)).data.data.eps)))
  const result = flatten(sortBy(ep, 'page').map(v => v.docs.map(v => new Ep(v)))) as Ep[] & { id?: string }
  result.id = id
  return result
})

export type RecommendComics = ProComic[] & {
  id?: string
}
export const getRecommendComics = async (id: string, config: AxiosRequestConfig = {}): Promise<RecommendComics> => {
  const result = (await api.get<RawData<{ comics: RawProComic[] }>>(`/comics/${id}/recommendation`, config)).data.data.comics.map(v => new ProComic(v)) as ProComic[] & { id?: string }
  result.id = id
  return result
}

interface RawPage {
  id: string
  media: RawImage
  _id: string
}
export class Page {
  public id!: string
  private _media?: Image
  public get media() {
    return this._media!
  }
  public set media(v) {
    this._media = new Image(v)
  }
  public _id!: string
  constructor(v: RawPage) {
    setValue(this, v)
  }
}
type Pages = Result<RawPage>
export const getComicPage = async (id: string, index: number, page: number, config: AxiosRequestConfig = {}) => (await api.get<RawData<{ pages: Pages }>>(`/comics/${id}/order/${index}/pages?page=${page}`, config)).data.data.pages
const comicsPagesDB = localforage.createInstance({ name: 'comic-page' })
export const clearComicPagesTemp = () => comicsPagesDB.clear()
await comicsPagesDB.ready()
const comicPageRequesting = new Map<string, Promise<Page[]>>()
export const getComicPages = async (id: string, index: number, config: AxiosRequestConfig = {}) => {
  const key = id + '|' + index
  const pageDB = await comicsPagesDB.getItem<Pages[]>(key)
  if (pageDB) return flatten(pageDB.map(v => v.docs.map(v => new Page(v))))
  if (comicPageRequesting.has(key)) return comicPageRequesting.get(key)!
  const _pages = new Promise<Page[]>(async r => {
    const firstPage = await getComicPage(id, index, 1, config)
    const otherPages = new Array<Pages>()
    otherPages.push(firstPage)
    otherPages.push(...await Promise.all(times(firstPage.pages - 1, i => getComicPage(id, index, i + 2, config))))
    const pages = flatten(sortBy(otherPages, 'page').map(v => v.docs.map(v => new Page(v))))
    console.log('comic images', pages)
    r(pages)
    await comicsPagesDB.setItem<Pages[]>(key, sortBy(otherPages, 'page'))
  })
  comicPageRequesting.set(key, _pages)
  const pages = await _pages
  comicPageRequesting.delete(key)
  return pages
}
export type ResultActionData<T extends string> = RawData<{ action: T }>
export const likeComic = async (id: string, config: AxiosRequestConfig = {}) => (await api.post<ResultActionData<'like' | 'unlike'>>(`/comics/${id}/like`, {}, config)).data.data.action
export const favouriteComic = async (id: string, config: AxiosRequestConfig = {}) => (await api.post<ResultActionData<'favourite' | 'un_favourite'>>(`/comics/${id}/favourite`, {}, config)).data.data.action

interface RawComment {
  _id: string
  content: string
  _user: User
  title: string
  description: string
  thumb: RawImage
  _comic: string
  totalComments: number
  isTop: boolean
  hide: boolean
  created_at: string
  id: string
  likesCount: number
  commentsCount: number
  isLiked: boolean
}
export class Comment {
  public _id!: string
  public content!: string
  private __user?: CommenUser
  public get _user() {
    return this.__user!
  }
  public set _user(v) {
    this.__user = new User(v)
  }
  public title!: string
  public description!: string
  private _thumb?: Image
  public get thumb() {
    return this._thumb!
  }
  public set thumb(v) {
    this._thumb = new Image(v)
  }
  public _comic!: string
  public totalComments!: number
  public isTop!: boolean
  public hide!: boolean
  public created_at!: string
  public id!: string
  public likesCount!: number
  public commentsCount!: number
  public isLiked!: boolean
  constructor(v: RawComment & any) {
    setValue(this, v)
  }
  public async like() {
    this.likesCount ??= 0
    const loading = createLoadingMessage('点赞中')
    try {
      const ret = await loading.bind(likeComment(this._id))
      this.isLiked = !this.isLiked
      if (ret == 'like') this.likesCount++
      else this.likesCount--
      return ret
    } catch (error) {
      throw error
    }
  }
  public async report(askUser = true) {
    const rp = () => {
      const loading = createLoadingMessage('举报中')
      return loading.bind(reportComment(this._id), false)
    }
    if (askUser) await createDialog({
      content: '举报后会进行对该评论的审核',
      title: '确定举报？',
      onPositiveClick: rp
    })
    else await rp()
  }
}
export class CommentsStream implements Stream<Comment> {
  constructor(public id: string) { }
  protected sac = new SmartAbortController()
  public stop() {
    this.sac.abort()
  }
  public docs = ref<Comment[]>([])
  public top = ref<Comment[]>([])
  public reload() {
    this.docs.value = []
    this.top.value = []
    this.page.value = 0
    this.pages.value = NaN
  }
  protected addTopValue(value: Comment[]) {
    this.top.value.push(...value.map(v => new Comment(v)))
    this.top.value = uniqBy(this.top.value, '_id')

  }
  public host = 'comics'
  public pages = shallowRef(NaN)
  public total = computed(() => this.docs.value.length + this.top.value.length)
  public page = shallowRef(0)
  public done = computed(() => this.page.value >= this.pages.value)
  public isRequesting = shallowRef(false)
  public async next() {
    if (this.isRequesting.value) return
    try {
      this.page.value++
      this.isRequesting.value = true
      const data = (await api.get<RawData<{
        comments: Result<Comment>
        topComments: Comment[]
      }>>(`/${this.host}/${this.id}/comments?page=${this.page.value}`, { signal: this.sac.signal })).data.data
      this.pages.value = data.comments.pages
      if (!isEmpty(data.topComments)) this.addTopValue(data.topComments)
      this.addValue(data.comments.docs)
      this.isErr.value = false
      this.errCause.value = undefined
    } catch (err) {
      this.isErr.value = true
      if (err instanceof Error) this.errCause.value = err.message || err.name
    }
    this.isRequesting.value = false
  }
  public isErr = shallowRef(false)
  public errCause = shallowRef<string>()
  public async retry() {
    if (!this.isErr.value) return
    this.page.value--
    return this.next()
  }
  protected addValue(value: RawComment[]) {
    this.docs.value.push(...value.filter(v => !v.isTop).map(v => new Comment(v)))
    triggerRef(this.docs)
  }
}

export class ChildrenCommentsStream extends CommentsStream {
  constructor(id: string) { super(id) }
  public override async next() {
    if (this.isRequesting.value) return
    try {
      this.page.value++
      this.isRequesting.value = true
      const data = (await api.get<RawData<{ comments: Result<RawComment> }>>(`/comments/${this.id}/childrens?page=${this.page.value}`, { signal: this.sac.signal })).data.data.comments
      this.pages.value = data.pages
      this.addValue(data.docs)
      this.isErr.value = false
      this.errCause.value = undefined
    } catch (err) {
      this.isErr.value = true
      if (err instanceof Error) this.errCause.value = err.message || err.name
    }
    this.isRequesting.value = false
  }
  public load(id: string) {
    this.id = id
    this.docs.value = []
    this.top.value = []
    this.page.value = 0
    this.pages.value = NaN
  }
}
export const likeComment = async (id: string, config: AxiosRequestConfig = {}) => (await api.post<ResultActionData<'like' | 'unlike'>>(`/comments/${id}/like`, {}, config)).data.data.action
export const reportComment = async (id: string, config: AxiosRequestConfig = {}) => (await api.post<RawData<any>>(`/comments/${id}/report`, {}, config)).data.data
export const sendComment = async (id: string, content: string, config: AxiosRequestConfig = {}) => (await api.post<RawData<never>>(`/comics/${id}/comments`, { content }, config))
export const sendChildComment = async (id: string, content: string, config: AxiosRequestConfig = {}) => (await api.post<RawData<never>>(`/comments/${id}`, { content }, config))


interface RawUserSentComment {
  _id: string
  content: string
  _comic: {
    _id: string
    title: string
  }
  totalComments: number
  hide: boolean
  created_at: string
  id: string
  likesCount: number
  commentsCount: number
  isLiked: boolean
}
export class UserSentComment {
  public _id!: string
  public content!: string
  public _comic!: {
    _id: string
    title: string
  }
  public totalComments!: number
  public hide!: boolean
  public created_at!: string
  public get created_time() {
    return new Date(this.created_at)
  }
  public id!: string
  public likesCount!: number
  public commentsCount!: number
  public isLiked!: boolean
  constructor(v: RawUserSentComment) {
    setValue(this, v)
  }
}

export class Me {
  public comments: MyCommentsStream
  public favourite: MyFavourtComicStream
  public data: UserProfile
  constructor(comments: MyCommentsStream, favourite: MyFavourtComicStream, data: UserProfile) {
    this.comments = comments
    this.favourite = favourite
    this.data = data
  }
  public static async getFromNet(config: AxiosRequestConfig = {}) {
    const data = {
      data: <UserProfile | undefined>undefined,
      comments: new MyCommentsStream(),
      favourite: new MyFavourtComicStream()
    }
    const [profile] = await Promise.all([
      getMyProfile(config),
      data.comments.next(),
      data.favourite.next()
    ])
    data.data = profile
    return new Me(data.comments, data.favourite, data.data)
  }
}

export const getMyProfile = async (config: AxiosRequestConfig = {}) => new UserProfile((await api.get<RawData<{ user: RawUserProfile }>>(`/users/profile`, config)).data.data.user)

export class MyFavourtComicStream extends ComicStream<ProComic> {
  constructor() {
    super('', 'dd', async (_k, page, sort, config) => createClass((await api.get<RawData<{ comics: Result<RawProComic> }>>(`/users/favourite?s=${sort}&page=${page}`, config)).data.data.comics, ProComic))
  }
  public reload(tag = '', sort = this.sort) {
    this.tag = tag
    this.sort = sort
    this.pages.value = NaN
    this.page.value = 0
    this.docs.value = []
  }
}

export const getUserProfile = async (id: string, config: AxiosRequestConfig = {}) => new UserProfile((await api.get<RawData<{ user: RawUserProfile }>>(`/users/${id}/profile`, config)).data.data.user)

export class MyCommentsStream implements Stream<UserSentComment> {
  public docs = shallowRef<UserSentComment[]>([])
  public pages = shallowRef(NaN)
  public total = computed(() => this.docs.value.length)
  public page = shallowRef(0)
  public done = computed(() => this.page.value >= this.pages.value)
  public isRequesting = shallowRef(false)
  protected sac = new SmartAbortController()
  public async next() {
    if (this.isRequesting.value) return
    try {
      this.page.value++
      this.isRequesting.value = true
      const data = (await api.get<RawData<{ comments: Result<RawUserSentComment> }>>(`/users/my-comments?page=${this.page.value}`, { signal: this.sac.signal })).data.data
      this.pages.value = data.comments.pages
      this.addValue(data.comments.docs)
      this.isErr.value = false
      this.errCause.value = undefined
    } catch (err) {
      this.isErr.value = true
      if (err instanceof Error) this.errCause.value = err.message || err.name
    }
    this.isRequesting.value = false
  }
  public isErr = shallowRef(false)
  public errCause = shallowRef<string>()
  public async retry() {
    if (!this.isErr.value) return
    this.page.value--
    return this.next()
  }
  protected addValue(value: RawUserSentComment[]) {
    this.docs.value.push(...value.map(v => new UserSentComment(v)))
    triggerRef(this.docs)
  }
  public reload(): void {
    this.docs.value = []
    this.page.value = 0
    this.pages.value = NaN
  }
  public stop(): void {
    this.sac.abort()
  }
}




interface RawKnight extends RawUser {
  comicsUploaded: number
}
export class Knight extends User {
  comicsUploaded!: number
  constructor(v: RawKnight) {
    super(v)
    setValue(this, v)
  }
}
export interface Levelboard {
  users: Knight[],
  comics: ProComic[][]
}
export const getLevelboard = async (config: AxiosRequestConfig = {}): Promise<Levelboard> => {
  const levelDatas = await Promise.all([
    api.get<RawData<{ comics: RawProComic[] }>>('/comics/leaderboard?tt=H24&ct=VC', config),
    api.get<RawData<{ comics: RawProComic[] }>>('/comics/leaderboard?tt=D7&ct=VC', config),
    api.get<RawData<{ comics: RawProComic[] }>>('/comics/leaderboard?tt=D30&ct=VC', config),
    api.get<RawData<{ users: RawKnight[] }>>('/comics/knight-leaderboard', config)
  ] as const)
  return {
    comics: (<AxiosResponse<RawData<{ comics: RawProComic[] }>>[]>levelDatas.slice(0, 3)).map(v => v.data.data.comics.map(v => new ProComic(v))),
    users: levelDatas[3].data.data.users.map(v => new Knight(v))
  }
}

interface RawAnnouncement {
  _id: string
  title: string
  content: string
  thumb: RawImage
}
export class Announcement {
  public _id!: string
  public title!: string
  public content!: string
  private _thumb?: Image
  public get thumb() {
    return this._thumb!
  }
  public set thumb(v) {
    this._thumb = new Image(v)
  }
  constructor(v: RawAnnouncement) {
    setValue(this, v)
  }
}

export class AnnouncementStream implements Stream<Announcement> {
  public docs = shallowRef<Announcement[]>([])
  public pages = shallowRef(NaN)
  public total = computed(() => this.docs.value.length)
  public page = shallowRef(0)
  public done = computed(() => this.page.value >= this.pages.value)
  public isRequesting = shallowRef(false)
  protected sac = new SmartAbortController()
  public async next() {
    if (this.isRequesting.value) return
    try {
      this.page.value++
      this.isRequesting.value = true
      const data = (await api.get<RawData<{ announcements: Result<RawAnnouncement> }>>(`/announcements?page=${this.page.value}`, { signal: this.sac.signal })).data.data
      this.pages.value = data.announcements.pages
      this.addValue(data.announcements.docs)
      this.isErr.value = false
      this.errCause.value = undefined
    } catch (err) {
      this.isErr.value = true
      if (err instanceof Error) this.errCause.value = err.message || err.name
    }
    this.isRequesting.value = false
  }

  public isErr = shallowRef(false)
  public errCause = shallowRef<string>()
  public async retry() {
    if (!this.isErr.value) return
    this.page.value--
    return this.next()
  }
  protected addValue(value: RawAnnouncement[]) {
    this.docs.value.push(...value.map(v => new Announcement(v)))
    triggerRef(this.docs)
  }
  public reload(): void {
    this.docs.value = []
    this.page.value = 0
    this.pages.value = NaN
  }
  public stop(): void {
    this.sac.abort()
  }
}
export interface Login {
  email: string
  password: string
}
export const login = (data: Login) => api.post<RawData<{ token: string }>>('/auth/sign-in', data)

export interface SignUp {
  email: string,
  password: string,
  name: string,
  birthday: string,
  gender: UserSex,
  answer1: string,
  answer2: string,
  answer3: string,
  question1: string,
  question2: string,
  question3: string
}
export const signUp = (data: SignUp) => api.post<RawData<never>>('/auth/register', data)

export const editSlogan = (slogan: string) => api.put<RawData<never>>('/users/profile', {
  slogan
})

export const editAvator = (imageDataUrl: string) => api.put('/users/avatar', {
  avatar: imageDataUrl
})