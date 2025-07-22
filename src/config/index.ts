import dayjs from "dayjs"
import { defineStore } from "pinia"
import proxyData from '@/api/bika_proxy.json'
import { useLocalStorage } from "@vueuse/core"
import symbol from "@/symbol"
import type { ImageQuality, SortType, FillerTag } from "@/api/bika"
const defaultConfig = {
  'bika.read.preloadImageNumbers': 2,
  'bika.read.watchFullscreen': true,
  'bika.read.vertical': false,
  'bika.read.twoImage': false,
  'bika.read.rtl': false,
  'bika.read.imageQuality': <ImageQuality>'original',
  'bika.search.sort': <SortType>'dd',
  'bika.search.fillerTags': new Array<FillerTag>(),
  'bika.search.showAIProject': true,
  "bika.proxy.interfaceId": proxyData.interface[0].id,
  "bika.proxy.image": proxyData.image[0],
  'bika.subscribe.updateTime': dayjs().format("YYYY-MM-DD"),
  'bika.info.unsortComic': false,
  'bika.darkMode': false,
  'bika.game.search.fillerTags': new Array<FillerTag>(),
  'bika.smallWindow.enable': false,
  'bika.smallWindow.openOnQuit': false,
}
export type ConfigType = typeof defaultConfig
export const useConfig = defineStore('config', () => {
  const config = useLocalStorage(symbol.config, defaultConfig)
  console.log('config setup', config.value)
  return {...config.value}
})