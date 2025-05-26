import { setValue, SmartAbortController } from '@/utils/requset'
import { api, Image, type RawData, type Result, type ResultActionData, type Stream } from '.'
import { computed, shallowRef, triggerRef } from 'vue'
import type { AxiosRequestConfig } from 'axios'
export abstract class BaseGame {
  public abstract _id: string
  public like(config: AxiosRequestConfig = {}) {
    return likeGame(this._id, config)
  }
  private __info?: PlusGame
  public async getInfo(config: AxiosRequestConfig = {}) {
    if (this.__info) return this.__info
    return this.__info = await getGameInfo(this._id, config)
  }
}
export class Game extends BaseGame {
  public _id!: string
  public title!: string
  public version!: string
  public publisher!: string
  public suggest!: boolean
  public adult!: boolean
  public android!: boolean
  public ios!: boolean
  private _icon?: Image
  public get icon() {
    return this._icon!
  }
  public set icon(v) {
    this._icon = new Image(v)
  }
  constructor(v: Game) {
    super()
    setValue(this, v)
  }
}
export class GameStream implements Stream<Game> {
  protected stopC = new SmartAbortController()
  public docs = shallowRef<Game[]>([])
  protected addValue(value: Game[]) {
    this.docs.value.push(...value.map(v => new Game(v)))
    triggerRef(this.docs)
  }
  public isErr = shallowRef(false)
  public errCause = shallowRef<string>()
  public async retry() {
    if (!this.isErr.value) return
    this.page.value--
    return this.next()
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
      const data = (await api.get<RawData<{ games: Result<Game> }>>(`/games?page=${this.page.value}`)).data.data.games
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
  public stop() {
    this.stopC.abort()
  }
}
export class PlusGame extends BaseGame {
  public _id!: string
  public title!: string
  public description!: string
  public version!: string
  public publisher!: string
  public ios!: boolean
  public iosLinks!: string[]
  public android!: boolean
  public androidLinks!: string[]
  public adult!: boolean
  public suggest!: boolean
  public downloadsCount!: number
  private _screenshots?: Image[]
  public get screenshots() {
    return this._screenshots!
  }
  public set screenshots(v) {
    this._screenshots = v.map(v => new Image(v))
  }
  private _icon?: Image
  public get icon() {
    return this._icon!
  }
  public set icon(v) {
    this._icon = new Image(v)
  }
  public androidSize!: number
  public iosSize!: number
  public updateContent!: string
  public videoLink!: string
  public updated_at!: string
  public created_at!: string
  public likesCount!: number
  public isLiked!: boolean
  public commentsCount!: number
  constructor(v: PlusGame) {
    super()
    setValue(this, v)
  }
}
export const getGameInfo = async (id: string, config: AxiosRequestConfig = {}) => new PlusGame((await api.get<RawData<{ game: PlusGame }>>(`/games/${id}`, config)).data.data.game)
export const likeGame = (id: string, config: AxiosRequestConfig = {}) => api.post<ResultActionData<'like' | 'unlike'>>(`/games/${id}/like`, config)
