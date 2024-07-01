<script setup lang='ts'>
import { StyleValue, computed, nextTick, shallowRef, watch } from 'vue'
import { ImageProps } from 'naive-ui'
import { useImagesStore } from '@/stores/images'
import { Image, showImagePreview } from '@/utils/image'
import { isString } from 'lodash-es'
const $props = defineProps<{
  src?: string | Image,
  previewable?: boolean
  foreverLoop?: boolean
  round?: boolean
  fit?: ImageProps['objectFit']
  class?: any,
  hideLoading?: boolean
  hideError?: boolean
  inline?: boolean
  style?: StyleValue
}>()
const src = computed(() => isString($props.src) ? $props.src : $props.src ? $props.src.getUrl ? $props.src.getUrl() : new Image($props.src).getUrl() : '')

const $emit = defineEmits<{
  load: any[]
  click: []
  error: []
}>()
let reloadTime = 0
const reload = async () => {
  if (!$props.foreverLoop) reloadTime++
  if (reloadTime > 6) {
    images.error.add(src.value)
    return $emit('error')
  }
  show.value = false
  await nextTick()
  show.value = true
}
const images = useImagesStore()
const show = shallowRef(true)
watch(() => src.value, () => {
  reloadTime = 0
  reload()
})
</script>

<template>
  <NImage @error="reload" v-bind="$props" :object-fit="fit" preview-disabled :img-props="{ class: 'w-full' }"
    :class="[{ '!rounded-full': !!round }, inline ? 'inline-flex' : 'flex', $props.class]" :style
    v-show="!images.error.has(src) && images.loaded.has(src)" v-if="show" @load="(...e) => {
      $emit('load', ...e)
      images.loaded.add(src)
    }" @click="(e: Event) => {
      $emit('click')
      if (previewable) {
        e.stopPropagation()
        showImagePreview([src], {
          closeable: true,
        })
      }
    }" :src>
  </NImage>
  <div class="justify-center items-center" v-if="!images.loaded.has(src) && !images.error.has(src) && !hideLoading"
    :class="[{ '!rounded-full': !!round }, inline ? 'inline-flex' : 'flex', $props.class]" :style>
    <VanLoading />
  </div>
  <div class="justify-center items-center flex-col" @click.stop="() => {
    reloadTime = 0
    images.error.delete(src)
    reload()
  }" v-if="images.error.has(src) && !hideError"
    :class="[{ '!rounded-full': !!round }, inline ? 'inline-flex' : 'flex', $props.class]">
    <VanIcon name="warning-o" size="2.5rem" color="var(--van-text-color-2)" />
    <div class="text-sm text-[--van-text-color-2]">点击重试</div>
  </div>
</template>