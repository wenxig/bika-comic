import type { Image_ } from "@/utils/image"
import { defineStore } from "pinia"
import { markRaw, ref, type Raw } from "vue"
import config from '@/config'
import { computed } from 'vue'

export namespace SmallWindow {
  export interface Config {
    begin?: number
  }
  export type GotoOriginPage = () => any
  export interface Context {
    config: Config
    images: Raw<Image_[]>
    gotoOriginPage: GotoOriginPage
    icon: Image_
  }
}
export const useSmallWindowContext = defineStore('smallWindowContext', () => {
  const ctx = ref<SmallWindow.Context | null>(null)
  const $open = (images: Image_[], icon: Image_, gotoOriginPage: SmallWindow.GotoOriginPage, config: SmallWindow.Config) => {
    ctx.value = {
      config,
      images: markRaw(images),
      gotoOriginPage,
      icon
    }
  }
  const $close = () => {
    ctx.value = null
  }
  const enable = computed(() => config.value['bika.smallWindow.enable'])
  return { $open, $close, ctx, enable }
})