<script setup lang='ts'>
import { useZIndex } from '@/utils/layout'
import { noop } from 'lodash-es'
import { PopupProps } from 'vant'
import { computed, StyleValue } from 'vue'
import { shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'
const $router = useRouter()
const $props = withDefaults(defineProps<Partial<PopupProps & {
  noBorder?: boolean,
  useTurlyShow: boolean
  style?: StyleValue
}>>(), {
  position: 'center',
  noBorder: false
})
const show = defineModel<boolean>('show', { required: true })
defineSlots<{
  default(): void
}>()
const turlyShow = shallowRef(show.value)
const [zIndex, isLast] = useZIndex(computed(() => $props.useTurlyShow ? turlyShow.value : show.value))
let stopRouter = noop
watch(show, _show => {
  if (_show) stopRouter = $router.beforeEach(() => {
    console.log('popup:\n', 'isLast:', isLast.value, 'show:', show.value)
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
  else stopRouter()
}, { immediate: true })
defineEmits<{
  closed: []
}>()
defineExpose({
  zIndex,
  turlyShow
})
</script>

<template>
  <VanPopup :duration :position :round :closeable v-model:show="show" :z-index teleport="#popups"
    @open="turlyShow = true" @closed="() => { turlyShow = false; $emit('closed') }"
    class="max-h-[100vh] !overflow-y-auto overflow-hidden" :style
    :class="!noBorder && 'border-0 border-t border-solid border-[--van-border-color]'">
    <slot v-if="turlyShow"></slot>
  </VanPopup>
</template>