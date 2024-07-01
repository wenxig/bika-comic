import { getConfig, putConfig } from "@/api/plusPlan"
import { computed, nextTick, reactive, watch } from "vue"
import proxyData from '@/api/proxy.json'
import { SmartAbortController } from "@/utils/requset"
import { defaultsDeep } from "lodash-es"
import { useFullscreen, usePreferredDark } from "@vueuse/core"
import { useOnline } from '@vueuse/core'

export const isOnline = useOnline()
export interface FillerTag {
  name: string
  mode: "unshow" | "show" | "auto"
}

const newDate = new Date()
const base = {
  preloadIamgeNumbers: 2,
  unsortComic: false,
  searchSort: 'dd' as SortType,
  fillerTags: new Array<FillerTag>(),
  plusPlan: true,
  proxy: {
    interface: proxyData.interface[0],
    image: proxyData.image[0],
    db: proxyData.db[0]
  },
  updateSub: `${newDate.getFullYear()}-${newDate.getMonth()}-${newDate.getDate()}`,
  darkMode: false,
  fullscreen: false,
  watchFullscreen: true,
  showAIProject: true,
  devMode: false
}
const config = reactive({ value: defaultsDeep(JSON.parse(localStorage.getItem('config') ?? '{}'), base) as typeof base })
let isSetup = true
if (isSetup) getConfig().then(async v => {
  if (!v) return
  localStorage.setItem('config', JSON.stringify(v))
  config.value = defaultsDeep(v, base)
  await nextTick()
  isSetup = false
})

const isSystemDark = usePreferredDark()
export const isDark = computed(() => config.value.darkMode || isSystemDark.value)

const stop = new SmartAbortController()
watch(config, ({ value: config }, { value: oldConfig }) => {
  console.log('change config')
  if (isSetup) return
  if (config.plusPlan) {
    stop.abort()
    putConfig(config, { signal: stop.signal })
  }
  if (config.darkMode != oldConfig.darkMode) loadTheme()
  localStorage.setItem('config', JSON.stringify(config))
})
const loadTheme = () => {
  const el = document.querySelector<HTMLMetaElement>("meta[name=theme-color]")
  el?.setAttribute('content', window.getComputedStyle(document.body).getPropertyValue('--van-background-2'))
}
document.addEventListener('DOMContentLoaded', () => {
  loadTheme()
})
localStorage.setItem('config', JSON.stringify(config.value))
export default config

export const fullscreen = useFullscreen()