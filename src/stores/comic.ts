import { defineStore } from 'pinia'
import { getComicEps, getRecommendComics, ProPlusMaxComic, type ProComic, type ProPlusComic, getComicInfo, type RecommendComics, type ComicEps } from '@/api'
import { computed, ref, shallowReactive, shallowRef } from 'vue'
import { isBoolean } from 'lodash-es'
import { useStateContentWithResolvers } from '@/utils/requset'
export type PreloadValue = ProComic | ProPlusComic | ProPlusMaxComic | undefined

export const useComicStore = defineStore('comic', () => {
  const pageHistory = shallowReactive(new Map<string, ComicPage>())
  const $load = (id: string, perload?: PreloadValue | false) => {
    if (pageHistory.has(id)) {
      now.value = pageHistory.get(id)!
      console.log('page cache hit', now.value)

    } else {
      now.value = new ComicPage(perload, id, false)
      pageHistory.set(id, now.value)
      console.log('page cache miss', now.value)
    }
    now.value.loadAll()
  }
  const now = shallowRef<ComicPage>()
  return {
    history: pageHistory,
    now,
    $load
  }
})


export class ComicPage {
  public preload = ref<PreloadValue>(undefined)
  public detail = ref<ProPlusMaxComic | undefined>(undefined)
  public union = computed(() => this.detail.value ?? this.preload.value)
  public detailStateContent = useStateContentWithResolvers<ProPlusMaxComic>()
  public setDetail(comic: ProPlusMaxComic | false) {
    if (isBoolean(comic)) {
      this.vailed.value = false
      this.detail.value = this.preload.value = undefined
      this.detailStateContent.load(undefined)
      return
    }
    this.detail.value = this.preload.value = comic
    this.detailStateContent.load(comic)
  }
  public async loadDetailFromNet() {
    this.detailStateContent.value.isLoading = true
    try {
      const info = await getComicInfo(this.comicId)
      this.setDetail(info)
    } catch {
      this.detailStateContent.load(undefined, true)
    }
  }
  public reloadDetailFromNet() {
    this.detail.value = this.preload.value = undefined
    this.detailStateContent.reset()
    return this.loadDetailFromNet()
  }

  public recommendComics = shallowRef<RecommendComics>()
  public recommendComicStateContent = useStateContentWithResolvers<RecommendComics>()
  public setRecommendComics(recommendComics: RecommendComics) {
    this.recommendComics.value = recommendComics
    this.recommendComicStateContent.load(recommendComics)
  }
  public async loadRecommendComics() {
    this.recommendComicStateContent.value.isLoading = true
    try {
      const info = await getRecommendComics(this.comicId)
      this.setRecommendComics(info)
    } catch {
      this.recommendComicStateContent.load(undefined, true)
    }
    this.recommendComicStateContent.value.isLoading = false
  }
  public reloadRecommendComicsFromNet() {
    this.recommendComics.value = undefined
    this.recommendComicStateContent.reset()
    return this.loadRecommendComics()
  }

  public eps = shallowRef<ComicEps>()
  public epsStateContent = useStateContentWithResolvers<ComicEps>()
  public setEps(eps: ComicEps) {
    this.eps.value = eps
    this.epsStateContent.load(eps)
  }
  public async loadEps() {
    this.epsStateContent.value.isLoading = true
    try {
      const info = await getComicEps(this.comicId)
      this.setEps(info)
    } catch {
      this.epsStateContent.load(undefined, true)
    }
    this.epsStateContent.value.isLoading = false
  }
  public reloadEpsFromNet() {
    this.eps.value = undefined
    this.epsStateContent.reset()
    return this.loadEps()
  }


  public vailed = shallowRef(true)

  public loadAll() {
    if (!this.vailed.value) return
    console.log('load all', this, !this.eps.value, !this.recommendComics.value)

    return Promise.any<unknown[]>([
      this.detailStateContent.value.isLoading || !this.detail.value && this.loadDetailFromNet(),
      this.epsStateContent.value.isLoading || !this.eps.value && this.loadEps(),
      this.recommendComicStateContent.value.isLoading || !this.recommendComics.value && this.loadRecommendComics()
    ])
  }
  public reloadAll() {
    this.vailed.value = true
    return Promise.any<unknown[]>([
      this.reloadDetailFromNet(),
      this.reloadEpsFromNet(),
      this.reloadRecommendComicsFromNet()
    ])
  }

  constructor(perload: PreloadValue | false, public comicId: string, autoLoad = true) {
    if (isBoolean(perload)) {
      this.vailed.value = false
      this.detailStateContent.load(undefined)
      this.recommendComicStateContent.load(undefined)
      this.epsStateContent.load(undefined)
      return
    }
    if (perload instanceof ProPlusMaxComic) this.setDetail(perload)
    this.preload.value = perload
    if (autoLoad) this.loadAll()
  }
  public static of(v: ComicPage) {
    return new ComicPage(v.vailed.value && v.union.value, v.comicId)
  }
}