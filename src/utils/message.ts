import { computed, isRef, shallowRef, watch, type CSSProperties, type MaybeRefOrGetter } from "vue"
import { delay } from "./delay"
import { isFunction } from "lodash-es"
import type { DialogOptions, DialogReactive, MessageReactive, useMessage } from "naive-ui"
import { useZIndex } from "./layout"
import { noop } from "@vueuse/core"
import router from "@/router"

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

export const createDialog = (options: DialogOptions & { style?: CSSProperties }) => {
  let success = noop
  let fail = noop
  const result: PromiseWith<void, { ins: DialogReactive }> = new Promise<void>((s, f) => { success = s; fail = f })
  const show = shallowRef(true)
  const [zIndex, isLast, stopUse] = useZIndex(show)
  const dialog = window.$dialog.create({
    positiveText: '确定',
    negativeText: '取消',
    ...options,
    style: {
      ...(options.style ?? {}),
      zIndex: zIndex.value
    },
    async onClose() {
      if ((await (options.onClose ?? noop)()) === false) return false
      else show.value = false; failStop()
    },
    async onPositiveClick(e) {
      if ((await (options.onPositiveClick ?? noop)(e)) === false) return false
      else successStop()
    },
    async onNegativeClick(e) {
      const ret = await (options.onNegativeClick ?? noop)(e)
      if (ret) return ret
      else failStop()
    },
    onEsc() {
      (options.onEsc ?? noop)()
      failStop()
    },
    onMaskClick(e) {
      (options.onMaskClick ?? noop)(e)
      failStop()
    },
    onAfterLeave() {
      (options.onAfterLeave ?? noop)()
      stop()
    }
  })
  const stopStyleWatch = watch(zIndex, zIndex => (<CSSProperties>dialog.style).zIndex = zIndex)
  const successStop = () => {
    success()
    stop()
  }
  const failStop = () => {
    fail()
    stop()
  }
  const stop = () => {
    stopStyleWatch()
    stopUse()
    stopRouterBreak()
    dialog.destroy()
    return show.value = false
  }
  const stopRouterBreak = router.beforeEach(() => {
    if (isLast) return failStop()
    return true
  })
  result.ins = dialog
  return result
}