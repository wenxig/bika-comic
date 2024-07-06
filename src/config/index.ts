import { computed, reactive } from "vue"
import proxyData from '@/api/proxy.json'
import { defaultsDeep } from "lodash-es"
import { useFullscreen, usePreferredDark } from "@vueuse/core"
import { useOnline } from '@vueuse/core'
import symbol from "@/symbol"

export const isOnline = useOnline()
export interface FillerTag {
  name: string
  mode: "unshow" | "show" | "auto"
}
type ImageQuality = 'original' | 'low' | 'medium' | 'high'
const newDate = new Date()
export const baseConfig = {
  'bika.read.preloadIamgeNumbers': 2,
  'bika.read.watchFullscreen': true,
  'bika.read.vertical': false,
  'bika.read.imageQuality': <ImageQuality>'original',
  'bika.search.sort': 'dd' as SortType,
  'bika.search.fillerTags': new Array<FillerTag>(),
  'bika.search.showAIProject': true,
  "bika.proxy.interface": proxyData.interface[0],
  "bika.proxy.image": proxyData.image[0],
  "bika.proxy.db": proxyData.db[0],
  "bika.proxy.chat": proxyData.chat[0],
  'bika.subscribe.updateTime': `${newDate.getFullYear()}-${newDate.getMonth()}-${newDate.getDate()}`,
  'bika.info.unsortComic': false,
  'bika.plusPlan': true,
  'bika.devMode': false,
  'bika.darkMode': false,
  'bika.game.search.fillerTags': new Array<FillerTag>()
}
const config = reactive({ value: defaultsDeep(JSON.parse(localStorage.getItem(symbol.config) ?? '{}'), baseConfig) as typeof baseConfig })

const isSystemDark = usePreferredDark()
export const isDark = computed(() => config.value['bika.darkMode'] || isSystemDark.value)
localStorage.setItem(symbol.config, JSON.stringify(config.value))
export default config

export const fullscreen = useFullscreen()