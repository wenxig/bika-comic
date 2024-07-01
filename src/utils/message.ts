import { computed, isRef, watch, type MaybeRefOrGetter } from "vue"
import { delay } from "./delay"
import { isFunction } from "lodash-es"
import type { MessageReactive, useMessage } from "naive-ui"

export const createLoadingMessage = (text: MaybeRefOrGetter<string> = '加载中', api = window.$message as ReturnType<typeof useMessage>, wait = false) => {
  const data = computed(() => isRef(text) ? text.value : isFunction(text) ? text() : text)
  let loading: MessageReactive
  if (!wait) loading = api.loading(data.value, {
    duration: 0,
  })
  const sto = setTimeout(() => {
    if (wait) if (!isDestroy) loading = api.loading(data.value, {
      duration: 0,
    })
  }, 200)
  const stop = watch(data, text => {
    loading.content = text
  })
  let isDestroy = false
  return {
    async success(text = "成功！", delayTime = 500) {
      stop()
      if (isDestroy || !loading) return
      clearTimeout(sto)
      isDestroy = true
      loading.type = 'success'
      loading.content = text
      await delay(delayTime)
      loading.destroy()
    },
    async fail(text = "失败！", delayTime = 500) {
      stop()
      if (isDestroy || !loading) return
      clearTimeout(sto)
      isDestroy = true
      loading.type = 'error'
      loading.content = text
      await delay(delayTime)
      loading.destroy()
    },
    async info(text: string, delayTime = 500) {
      stop()
      if (isDestroy || !loading) return
      clearTimeout(sto)
      isDestroy = true
      loading.type = 'info'
      loading.content = text
      await delay(delayTime)
      loading.destroy()
    },
    destroy() {
      stop()
      if (isDestroy || !loading) return
      clearTimeout(sto)
      isDestroy = true
      loading.destroy()
    },
    [Symbol.dispose]() {
      this.destroy()
    }
  }
}
