<script setup lang='ts'>
import { useZIndex } from '@/utils/layout'
import { noop } from 'lodash-es'
import { PopupProps } from 'vant'
import { shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'
const $router = useRouter()
withDefaults(defineProps<Partial<PopupProps & {
  noBorder?: boolean
}>>(), {
  position: 'center',
  noBorder: false
})
const show = defineModel<boolean>('show', { required: true })
defineSlots<{
  default(): void
}>()
const [zIndex, isLast] = useZIndex(show)
let stopRouter = noop
watch(show, _show => {
  if (_show) stopRouter = $router.beforeEach(() => {
    console.log('popup:', isLast.value, show.value)

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
const turlyShow = shallowRef(show.value)
defineEmits<{
  closed: []
}>()
</script>

<template>
  <VanPopup :position :round :closeable v-model:show="show" :z-index teleport="#popups" @open="turlyShow = true"
    @closed="() => { turlyShow = false; $emit('closed') }"
    :class="!noBorder && 'border-0 border-t border-solid border-[--van-border-color]'">
    <slot v-if="turlyShow"></slot>
  </VanPopup>
</template>