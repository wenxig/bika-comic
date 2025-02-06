import { computed, ref } from "vue"
import { useFullscreen, usePreferredDark } from "@vueuse/core"
import { useOnline } from '@vueuse/core'
import { AxiosRequestConfig } from "axios"
import { defaultsDeep, isEmpty } from "lodash-es"
import dayjs from "dayjs"

import proxyData from '@/api/proxy.json'

import symbol from "@/symbol"
import { setValue } from "@/utils/requset"
import type { PlusServreRes } from "@/api/plusPlan"


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
    setValue(this, config)
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
    const { plusId, api } = await import("@/api/plusPlan")
    if (!plusId) return false
    return new UserConfig(defaultsDeep((await api.get<PlusServreRes<RawUserConfig>>(`/${plusId}/setting`, config)).data.data, this.default))
  }

  public static async update(data: Partial<UserConfig>, config: AxiosRequestConfig = {}) {
    const { plusId, api } = await import("@/api/plusPlan")
    if (!plusId || isEmpty(data)) return false
    return new UserConfig((await api.put<PlusServreRes<RawUserConfig>>(`/${plusId}/setting`, defaultsDeep(data, this.default), config)).data.data)
  }

  public static getFromDB() {
    return new UserConfig(defaultsDeep(JSON.parse(localStorage.getItem(symbol.config) ?? '{}'), this.default))
  }
}
export type RawUserConfig = typeof UserConfig.default


export const isOnline = useOnline()
export interface FillerTag {
  name: string
  mode: "unshow" | "show" | "auto"
}

const config = ref(UserConfig.getFromDB())

const isSystemDark = usePreferredDark()
export const isDark = computed(() => config.value['bika.darkMode'] || isSystemDark.value)
localStorage.setItem(symbol.config, JSON.stringify(config.value))
export default config

export const fullscreen = useFullscreen()