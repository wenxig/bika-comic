import config from "@/config"

export interface RawImage {
  originalName: string
  path: string
  fileServer: string
}
const setValue = <T extends object>(v: T, v2: T) => {
  for (const key in v2) {
    const element = v2[key]
    if (element) v[key] = element
  }
}
export class Image {
  public originalName!: string
  public path!: string
  public fileServer!: string
  constructor(v: RawImage) {
    setValue(this, v)
  }
  public getUrl() {
    return getUrl(this)
  }
}
function getUrl(thumb?: Image) {
  if (thumb instanceof Image) {
    if (thumb!.fileServer == 'local') return new URL(`../assets/images/${thumb!.path}`, import.meta.url).href
    return new URL(`${config.value['bika.proxy.image']}/${thumb!.path}`).href
  }
  return ''
}
import router from '@/router'
import { showImagePreview as _showImagePreview, ImagePreviewOptions, ImagePreviewInstance } from 'vant'
import { computed, shallowRef } from 'vue'
import { useZIndex } from "./layout"
import { watchOnce } from "@vueuse/core"
export const showImagePreview = (images: string[], config: Omit<ImagePreviewOptions, "images" | "teleport">) => {
  const isShowing = shallowRef(true)
  const [, , stopUse] = useZIndex(isShowing)
  const ins = _showImagePreview({
    images,
    ...config,
    overlayClass: '!z-[2147483646]',
    className: '!z-[2147483646]',
    onClose() {
      isShowing.value = false
    },
    showIndex: images.length > 1,
    teleport: '#popups'
  }) as ImagePreviewInstance
  const stopRouterBreak = router.beforeEach(() => isShowing.value = false)
  watchOnce(isShowing, () => {
    stopRouterBreak()
    stopUse()
    ins.show = false
  })
  return {
    isShowing: computed(() => ins.show),
    close: () => {
      isShowing.value = false
    }
  }
}

