import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig, isCancel, type AxiosResponse } from 'axios'
import { postHeader } from './bk_until'
import { max, times, uniqBy, flatten, sortBy, values } from 'lodash-es'
import { computed, ref, shallowRef, triggerRef, type Ref } from 'vue'
import { toCn, toTw } from '@/utils/translater'
import router from '@/router'
import config, { isOnline } from '@/config'
import { SmartAbortController } from '@/utils/requset'
import { delay } from '@/utils/delay'
import { RawImage, Image } from '@/utils/image'
import { useAppStore } from '@/stores'
import { until } from '@vueuse/core'
export { type RawImage, Image } from '@/utils/image'
const createClass = <T extends { docs: any[] }, C>(v: T, Class: new (data: T['docs'][number]) => C): T & { docs: C[] } => {
  v.docs = v.docs.map(v => new Class(v))
  return v
}
const setValue = <T extends object>(v: T, v2: T) => {
  for (const key in v2) {
    const element = v2[key]
    if (element) v[key] = element
  }
}
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
  data: T
}

export const api = (() => {
  const a = axios.create({
    baseURL: '',
    timeout: 5000
  })
  a.interceptors.request.use(async requestConfig => {
    if (values(requestConfig.data).includes(undefined)) throw Promise.reject('some values is undefined')
    requestConfig.baseURL = config.value.proxy.interface
    for (const value of postHeader((new Date().getTime() / 1000).toFixed(0), `${requestConfig.url?.substring(1)}`, requestConfig.method!.toUpperCase())) requestConfig.headers.set(value.name, value.value)
    await until(isOnline).toBe(true)
    return requestConfig
  })
  const errorReturn = (err: any) => {
    try {
      window.$message?.error('网络错误')
    } catch { }
    return Promise.reject(err)
  }
  a.interceptors.response.use(v => {
    if (config.value.devMode) {
      const app = useAppStore()
      const base = app.devData.get('defaultApi') ?? {
        name: '哔咔api',
        data: []
      }
      base.data.push(v)
      app.devData.set('defaultApi', base)
    }
    return v
  }, async err => {
    if (err?.request?.status == 401 && localStorage.getItem('userLoginData')) {
      localStorage.setItem('token', (await login(JSON.parse(localStorage.getItem('userLoginData')!))).data.data.token)
      return a(err.config)
    }
    else if (err?.request?.status == 401 && !location.pathname.includes('auth')) {
      localStorage.removeItem('token')
      await router.force.replace('/auth/login')
      return Promise.reject(err)
    }
    if (location.pathname.startsWith('/auth')) return Promise.reject(err)
    if (isCancel(err)) return Promise.reject(err)
    const error = err?.response as AxiosResponse
    if (error?.data.error == '1014') return Promise.resolve({ data: false })
    if (/^[45]/g.test(<string>err?.request?.status?.toString())) return errorReturn(err)
    const config: InternalAxiosRequestConfig & { __retryCount: number, retry: number } = err.config
    if (config?.__retryCount && config.__retryCount >= config.retry) return errorReturn(err)
    config.__retryCount = config?.__retryCount ?? 0
    config.__retryCount++
    await delay(1000)
    return a(config)
  });
  (<any>a.defaults).retry = 10 //重试次数
  return a
})()
window.$api.api = api

export const punch = (config: AxiosRequestConfig = {}) => api.post('/users/punch-in', undefined, config)
punch()
export abstract class Comic {
  public abstract _id: string
  public like(config: AxiosRequestConfig = {}) {
    return likeComic(this._id, config)
  }
  public favourt(config: AxiosRequestConfig = {}) {
    return favouriteComic(this._id, config)
  }
  private __info?: ProPlusMaxComic
  public async getInfo(config: AxiosRequestConfig = {}) {
    if (this.__info) return this.__info
    const info = await getComicInfo(this._id, config)
    if (info) return this.__info = info
    else return undefined
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
  public _id!: string
  public title!: string
  public author!: string
  public totalViews!: number
  public totalLikes!: number
  public pagesCount!: number
  public epsCount!: number
  public finished!: boolean
  public categories!: string[]
  private _thumb?: Image
  public get thumb() {
    return this._thumb!
  }
  public set thumb(v) {
    this._thumb = new Image(v)
  }
  public likesCount!: number
  constructor(v: RawProComic) {
    super()
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
  private _thumb?: Image
  public get thumb() {
    return this._thumb!
  }
  public set thumb(v) {
    this._thumb = new Image(v)
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
  public _id!: string
  public likesCount!: number
  constructor(v: RawProPlusComic) {
    super()
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
  public _id!: string
  private __creator?: User
  public get _creator() {
    return this.__creator!
  }
  public set _creator(v) {
    this.__creator = new User(v)
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
  public likesCount!: number
  public commentsCount!: number
  public isFavourite!: boolean
  public isLiked!: boolean
  constructor(v: RawProPlusMaxComic) {
    super()
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
}
export const getCollections = async (config: AxiosRequestConfig = {}) => (await api.get<RawData<{ collections: RawCollection[] }>>("/collections", config)).data.data.collections.map(v => new Collection(v))

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
}
export const getCategories = async (config: AxiosRequestConfig = {}) => (await api.get<RawData<{ categories: RawCategories[] }>>("/categories", config)).data.data.categories.map(v => new Categories(v))

export type HotTag = string
export const getHotTags = async (config: AxiosRequestConfig = {}) => (await api.get<RawData<{ keywords: HotTag[] }>>("/keywords", config)).data.data.keywords

export type SearchResult<T = RawProPlusComic> = Result<T>


export interface Stream<T> {
  docs: Ref<T[]>
  pages: Ref<number>
  total: Ref<number>
  page: Ref<number>
  done: Ref<boolean>
  isRequesting: Ref<boolean>
  next(): Promise<void>
  reload(text: string, sort: SortType): void
  stop(): void
}

export interface ComicStream<T = ProPlusComic> extends Stream<T> {
  sort: SortType
}
export abstract class PlusComicStream<T = ProPlusComic> implements ComicStream<T> {
  protected stopC = new SmartAbortController()
  public docs = shallowRef<T[]>([])
  protected addValue(value: T[]) {
    this.docs.value.push(...value)
    triggerRef(this.docs)
  }
  public constructor(protected tag: string, public sort: SortType = 'dd', protected getDataFunction?: (keyword: string, page: number, sort: SortType, config?: AxiosRequestConfig) => Promise<Result<any>>) { }
  public pages = shallowRef(NaN)
  public total = computed(() => this.docs.value.length)
  public page = shallowRef(0)
  public done = computed(() => this.page.value >= this.pages.value)
  public isRequesting = shallowRef(false)
  public reload(tag: string, sort: SortType) {
    this.tag = tag
    this.sort = sort
    this.pages.value = NaN
    this.page.value = 0
    this.docs.value = []
  }
  public async next(): Promise<void> {
    if (this.isRequesting.value) return
    this.isRequesting.value = true
    try {
      if (!this.getDataFunction) return void (this.isRequesting.value = false)
      this.page.value++
      const data = await this.getDataFunction(this.tag, this.page.value, this.sort, { signal: this.stopC.signal })
      this.pages.value = data.pages
      this.addValue(data.docs)
    } catch { }
    this.isRequesting.value = false
  }
  public stop() {
    this.stopC.abort()
  }
}
export class RandomComicStream {
  protected stopC = new SmartAbortController()
  public docs = shallowRef<ProComic[]>([])
  protected addValue(value: ProComic[]) {
    this.docs.value.push(...value)
    triggerRef(this.docs)
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
  public async next(): Promise<void> {
    if (this.isRequesting.value) return
    this.isRequesting.value = true
    try {
      this.page.value++
      const data = await getComicsIn('random', undefined, { signal: this.stopC.signal })
      this.pages.value = Infinity
      this.addValue(data)
    } catch { }
    this.isRequesting.value = false
  }
  public stop() {
    this.stopC.abort()
  }
}
export type ResultOfSearch = Pick<SearchResult, 'docs' | 'total'>
export const searchComics = async (keyword: string, page = 1, sort: SortType = 'dd', config: AxiosRequestConfig = {}): Promise<SearchResult<ProPlusComic>> => {
  const /** 程序猿的千重解构 */[{ data: { data: { comics: data_TW } } }, { data: { data: { comics: data_CN } } }] = await Promise.all([
    api.post<RawData<{ comics: SearchResult }>>(`/comics/advanced-search?page=${page}&sort=${sort}`, { keyword: toTw(keyword), sort }, config),
    api.post<RawData<{ comics: SearchResult }>>(`/comics/advanced-search?page=${page}&sort=${sort}`, { keyword: toCn(keyword), sort }, config)
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
export class ComicStreamWithKeyword extends PlusComicStream {
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
  public async next() {
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
    } catch { }
    this.isRequesting.value = false
  }
  public reload(tag: string, sort: SortType) {
    this.tag = tag
    this.sort = sort
    this.page.value = 0
    this.cnPages.value = this.twPages.value = NaN
    this.docs.value = []
  }
}

export const searchComicsWithAuthor = async (author: string, page = 1, sort: SortType = 'dd', config: AxiosRequestConfig = {}) => {
  const data = await searchComics(author, page, sort, config)
  data.docs = data.docs.filter(v => v.author == author)
  return data
}
export class ComicStreamWithAuthor extends PlusComicStream {
  constructor(public author: string, sort: SortType = 'dd') { super(author, sort, searchComicsWithAuthor) }
}


export const searchComicsWithTranslater = async (translater: string, page = 1, sort: SortType = 'dd', config: AxiosRequestConfig = {}) => {
  const data = await searchComics(translater, page, sort, config)
  data.docs = data.docs.filter(v => v.chineseTeam == translater)
  return data
}
export class ComicStreamWithTranslater extends PlusComicStream {
  constructor(public translater: string, sort: SortType = 'dd') { super(translater, sort, searchComicsWithTranslater) }
}

export const searchComicsWithUploader = async (id: string, page = 1, sort: SortType = 'dd', config: AxiosRequestConfig = {}) => createClass((await api.get<RawData<{ comics: SearchResult<RawProComic> }>>(`/comics?page=${page}&ca=${id}&s=${sort}`, config)).data.data.comics, ProComic)
export class ComicStreamWithUploader extends PlusComicStream<ProComic> {
  constructor(public id: string, sort: SortType = 'dd') { super(id, sort, searchComicsWithUploader) }
}
export const searchComicsWithCategories = async (categorie: string, page = 1, sort: SortType = 'dd', config: AxiosRequestConfig = {}) => createClass((await api.get<RawData<{ comics: SearchResult<RawProComic> }>>(`/comics?page=${page}&c=${encodeURIComponent(categorie)}&s=${sort}`, config)).data.data.comics, ProComic)
export class ComicStreamWithCategories extends PlusComicStream<ProComic> {
  constructor(public categorie: string, sort: SortType = 'dd') { super(categorie, sort, searchComicsWithCategories) }
}

export const searchComicsWithTag = async (tag: string, page = 1, sort: SortType = 'dd', config: AxiosRequestConfig = {}) => createClass((await api.get<RawData<{ comics: SearchResult<RawProComic> }>>(`/comics?page=${page}&t=${encodeURIComponent(tag)}&s=${sort}`, config)).data.data.comics, ProComic)
export class ComicStreamWithTag extends PlusComicStream<ProComic> {
  constructor(tag: string, sort: SortType = 'dd') { super(tag, sort, searchComicsWithTag) }
}

export class ComicStreamWithId extends PlusComicStream {
  constructor(id: string, sort: SortType = 'dd') { super(id, sort) }
  public async next() {
    if (this.isRequesting.value) return
    this.isRequesting.value = true
    try {
      const data = await getComicInfo(this.tag, { signal: this.stopC.signal })
      if (!data) return void (this.isRequesting.value = false)
      this.pages.value = 1
      this.addValue([<any>data])
    } catch {
      this.pages.value = 1
      this.docs.value = []
    }
    this.isRequesting.value = false
  }
  public done = computed(() => this.docs.value.length == 1)
}

export class ComicStreamWithNoop extends PlusComicStream {
  constructor(id: string, sort: SortType = 'dd') { super(id, sort) }
  public async next() {
    this.docs.value = []
    this.pages.value = 1
  }
  public done = computed(() => true)
}

export type UserCharacters = 'knight' | 'member'
export type UserSex = 'f' | 'm' | 'bot'
interface RawUser {
  _id: string
  gender: UserSex
  name: string
  verified: boolean
  exp: number
  level: number
  characters: UserCharacters[]
  role?: UserCharacters
  avatar: RawImage
  title: string
  slogan: string
}
export class User {
  public _id!: string
  public gender!: UserSex
  public name!: string
  public verified!: boolean
  public exp!: number
  public level!: number
  public characters!: UserCharacters[]
  public role?: UserCharacters
  private _avatar?: Image
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
export const getComicEps = (async (id: string, config: AxiosRequestConfig = {}) => {
  const ep = new Array<Eps>()
  const baseEps = (await api.get<RawData<{ eps: Eps }>>(`/comics/${id}/eps?page=1`)).data.data.eps
  ep.push(baseEps)
  await Promise.all(times(baseEps.pages - 1, async i => ep.push((await api.get<RawData<{ eps: Eps }>>(`/comics/${id}/eps?page=${i + 2}`, config)).data.data.eps)))
  return flatten(sortBy(ep, 'page').map(v => v.docs.map(v => new Ep(v))))
})

export const getComicLikeOthers = async (id: string, config: AxiosRequestConfig = {}) => (await api.get<RawData<{ comics: RawProComic[] }>>(`/comics/${id}/recommendation`, config)).data.data.comics.map(v => new ProComic(v))

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
const comicsPagesStore = new Map<string, Page[]>()
export const getComicPages = async (id: string, index: number, config: AxiosRequestConfig = {}) => {
  const key = id + index
  if (comicsPagesStore.has(key)) return comicsPagesStore.get(key)!
  const firstPage = await getComicPage(id, index, 1, config)
  const otherPages = new Array<Pages>()
  otherPages.push(firstPage)
  await Promise.all(times(firstPage.pages - 1, async i => otherPages.push(await getComicPage(id, index, i + 2, config))))
  return flatten(sortBy(otherPages, 'page').map(v => v.docs.map(v => new Page(v))))
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
  private __user?: User
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
  constructor(v: RawComment) {
    setValue(this, v)
  }
}
export class CommentsStream implements Stream<RawComment> {
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
  protected addValue(value: RawComment[]) {
    this.docs.value.push(...value.map(v => new Comment(v)))
    triggerRef(this.docs)
  }
  protected addTopValue(value: Comment[]) {
    this.top.value.push(...value.map(v => new Comment(v)))
    triggerRef(this.top)
  }
  public host = 'comics'
  public pages = shallowRef(NaN)
  public total = computed(() => this.docs.value.length + this.top.value.length)
  public page = shallowRef(0)
  public done = computed(() => this.page.value >= this.pages.value)
  public isRequesting = shallowRef(false)
  public async next() {
    if (this.isRequesting.value) return
    this.page.value++
    this.isRequesting.value = true
    const data = (await api.get<RawData<{
      comments: Result<Comment>
      topComments: Comment[]
    }>>(`/${this.host}/${this.id}/comments?page=${this.page.value}`, { signal: this.sac.signal })).data.data
    this.pages.value = data.comments.pages
    this.addValue(data.comments.docs)
    if (this.page.value == 1) this.addTopValue(data.topComments)
    this.isRequesting.value = false
  }
}

export class ChildrenCommentsStream extends CommentsStream {
  constructor(id: string) { super(id) }
  public override async next() {
    if (this.isRequesting.value) return
    this.page.value++
    this.isRequesting.value = true
    const data = (await api.get<RawData<{ comments: Result<RawComment> }>>(`/comments/${this.id}/childrens?page=${this.page.value}`, { signal: this.sac.signal })).data.data.comments
    this.pages.value = data.pages
    this.addValue(data.docs)
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
  characters: UserCharacters[]
  created_at: string
  avatar: RawImage
  isPunched: boolean
}
export class UserProfile {
  public _id!: string
  public birthday!: string
  public email!: string
  public gender!: UserSex
  public name!: string
  public slogan!: string
  public title!: string
  public verified!: boolean
  public exp!: number
  public level!: number
  public characters!: UserCharacters[]
  public created_at!: string
  public get created_time() {
    return new Date(this.created_at)
  }
  private _avatar?: Image
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
}
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
export interface Me {
  comments: UserSentComment[]
  favourite: ProComic[]
  data: UserProfile
}
export const getMe = async (config: AxiosRequestConfig = {}): Promise<Me> => {
  const getFav = async () => {
    const firstPage = (await api.get<RawData<{ comics: Result<RawProComic> }>>(`/users/favourite?s=dd&page=1`, config)).data.data.comics
    const otherPages = new Array<Result<RawProComic>>()
    otherPages.push(firstPage)
    await Promise.all(times(firstPage.pages - 1, async i => otherPages.push((await api.get<RawData<{ comics: Result<RawProComic> }>>(`/users/favourite?s=dd&page=${i + 2}`, config)).data.data.comics)))
    return flatten(sortBy(otherPages, 'page').map(v => v.docs))
  }
  const getCom = async () => {
    const firstPage = (await api.get<RawData<{ comments: Result<RawUserSentComment> }>>(`/users/my-comments?page=1`, config)).data.data.comments
    const otherPages = new Array<Result<RawUserSentComment>>()
    otherPages.push(firstPage)
    await Promise.all(times(firstPage.pages - 1, async i => otherPages.push((await api.get<RawData<{ comments: Result<RawUserSentComment> }>>(`/users/my-comments?page=${i + 2}`, config)).data.data.comments)))
    return flatten(sortBy(otherPages, 'page').map(v => v.docs))
  }
  const data = await Promise.all([api.get<RawData<{ user: RawUserProfile }>>(`/users/profile`, config), getFav(), getCom()])
  return {
    data: new UserProfile(data[0].data.data.user),
    comments: data[2].map(v => new UserSentComment(v)),
    favourite: data[1].map(v => new ProComic(v))
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
export const getAnnouncements = async (config: AxiosRequestConfig = {}) => {
  const firstPage = (await api.get<RawData<{ announcements: Result<RawAnnouncement> }>>(`/announcements?page=1`, config)).data.data.announcements
  const otherPages = new Array<Result<RawAnnouncement>>()
  otherPages.push(firstPage)
  await Promise.all(times(firstPage.pages - 1, async i => otherPages.push((await api.get<RawData<{ announcements: Result<RawAnnouncement> }>>(`/announcements?page=${i + 2}`, config)).data.data.announcements)))
  return flatten(sortBy(otherPages, 'page').map(v => v.docs.map(v => new Announcement(v))))
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