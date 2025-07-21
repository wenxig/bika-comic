import type { bika } from "@/api/bika"
import dayjs from "dayjs"
import { defineStore } from "pinia"
import proxyData from '@/api/bika_proxy.json'
import { useLocalStorage } from "@vueuse/core"
import symbol from "@/symbol"
const defaultConfig = {
  'bika.read.preloadImageNumbers': 2,
  'bika.read.watchFullscreen': true,
  'bika.read.vertical': false,
  'bika.read.twoImage': false,
  'bika.read.rtl': false,
  'bika.read.imageQuality': <bika.ImageQuality>'original',
  'bika.search.sort': <bika.SortType>'dd',
  'bika.search.fillerTags': new Array<bika.FillerTag>(),
  'bika.search.showAIProject': true,
  "bika.proxy.interfaceId": proxyData.interface[0].id,
  "bika.proxy.image": proxyData.image[0],
  'bika.subscribe.updateTime': dayjs().format("YYYY-MM-DD"),
  'bika.info.unsortComic': false,
  'bika.darkMode': false,
  'bika.game.search.fillerTags': new Array<bika.FillerTag>(),
  'bika.smallWindow.enable': false,
  'bika.smallWindow.openOnQuit': false,
}
export type ConfigType = typeof defaultConfig
export const useConfig = defineStore('config', () => {
  const config = useLocalStorage(symbol.config, defaultConfig)
  return config
})