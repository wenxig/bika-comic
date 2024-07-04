<script setup lang='ts'>
import { useZIndex } from '@/utils/layout'
import { reactiveComputed, useWindowSize } from '@vueuse/core'
import { noop } from 'lodash-es'
import { shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'
const $router = useRouter()
const $props = withDefaults(defineProps<{
  anchors?: 'high' | 'low',
  lockScroll?: boolean
}>(), {
  anchors: 'high',
  lockScroll: false
})
const height = defineModel<number>('height', { default: 0 })
const { height: windowHeight } = useWindowSize()
const anchors: number[] = reactiveComputed(() => $props.anchors == 'high' ? [
  0,
  Math.round(0.4 * windowHeight.value),
  Math.round(0.7 * windowHeight.value),
  windowHeight.value,
] : [
  0,
  Math.round(0.3 * windowHeight.value),
  Math.round(0.6 * windowHeight.value),
  Math.round(0.9 * windowHeight.value),
])
const show = shallowRef(height.value != 0)
watch(height, height => {
  if (height != 0 && !show.value) {
    console.log('height change: show')
    show.value = true
  }
  else if (height == 0 && show.value) {
    console.log('height change: close')
    show.value = false
  }
}, { immediate: true })

defineSlots<{
  default(arg: { height: number }): void
}>()
const [zIndex, isLast] = useZIndex(show)

let stopRouter = noop
watch(show, _show => {
  if (_show) {
    stopRouter = $router.beforeEach(() => {
      console.log('float popup:', isLast.value, show.value)

      if (isLast.value) {
        if (show.value) {
          return show.value = false
        } else {
          return
        }
      } else {
        return
      }
    })
  }
  else {
    stopRouter()
  }
}, { immediate: true })

defineExpose({
  show(node = 2) {
    console.log('function show')
    show.value = true
    height.value = anchors[node]
  },
  close() {
    console.log('function close')
    show.value = false
  },
  isShowing: show
})
</script>

<template>
  <Teleport to="#popups">
    <Transition name="van-slide-up">
      <VanFloatingPanel v-show="show" :anchors v-model:height="height" :content-draggable="false" :lock-scroll
        :style="{ zIndex }" class="overflow-hidden border-0 border-t border-solid border-[--van-border-color]">
        <div class="bg-[--van-background] w-full"
          :style="{ height: `calc(${height}px - var(--van-floating-panel-header-height))` }">
          <slot v-if="height != 0" :height></slot>
        </div>
      </VanFloatingPanel>
    </Transition>
  </Teleport>
</template>