<script setup lang='ts'>
import config, { fullscreen } from '@/config'
import { computedWithControl } from '@vueuse/core'
import { ImagePreviewInstance } from 'vant'
import Image from '@/components/image.vue'
import { shallowReactive, readonly, watch, shallowRef } from 'vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'
import { useAppStore } from '@/stores'
const app = useAppStore()
const $route = useRoute()
const $props = defineProps<{
  images: string[],
  startPosition?: number,
  comicTitle?: string,
  epTitle?: string,
  show?: boolean
}>()
defineEmits<{
  lastEp: [],
  nextEp: [],
  back: []
}>()
const imagePreview = shallowRef<ImagePreviewInstance>()
const showMenu = shallowRef(false)
const page = shallowRef($props.startPosition ?? 0)
const loadedImagesList = shallowReactive<string[]>([])

const setPage = (iv: number) => page.value = iv + page.value
const getValue = (iv: number = 0) => $props.images[page.value + iv]
const showImages = computedWithControl(() => [page.value, $props.images], () => {
  const newValue = new Array<string>()
  if (!!getValue(-1)) {
    newValue.push(getValue(-1))
    imagePreview.value?.swipeTo(1, { immediate: true })
  } else imagePreview.value?.swipeTo(0, { immediate: true })
  if (!!getValue()) newValue.push(getValue())
  if (!!getValue(1)) newValue.push(getValue(1))
  return newValue
})

const isInSpace = (value: number, min: number, max: number) => value >= min && value < max

defineExpose({
  index: readonly(page),
  toIndex(index: number) {
    page.value = index
  }
})

const selectPage = shallowRef(Number($route.hash.substring(1)) - 1)
watch(page, page => selectPage.value = page)
const showSliderButtonNumber = shallowRef(false)

const full = () => {
  if (config.value.watchFullscreen) {
    fullscreen.enter()
  } else {
    fullscreen.exit()
  }
}
watch(() => $props.show, show => {
  if (fullscreen.isSupported.value && config.value.watchFullscreen && show) full()
}, { immediate: true })
onBeforeRouteLeave(() => {
  if (fullscreen.isSupported.value) fullscreen.exit()
})

defineSlots<{
  menu(): any
  left(arg: { width: string }): any
  right(arg: { width: string }): any
}>()
</script>

<template>
  <Teleport to="#comic-views">
    <VanImagePreview :max-zoom="Infinity" :show v-if="show" :images="showImages" :close-on-click-image="false"
      :close-on-click-overlay="false" :close-on-popstate="false" :loop="false" :show-index="false" ref="imagePreview"
      @change="i => setPage(i - (!!getValue(-1) ? 1 : 0))" style="--aside-width:15vw;" class="!z-[1]" overlay-class="!z-[1]">
      <template #cover>
        <div class="fixed top-0 left-0 w-[--aside-width] h-[100vh] flex items-center" @click="() => {
          if (isInSpace(page - 1, 0, images.length)) page--
          else $emit('lastEp')
        }">
          <div class="use-bg w-full flex-col flex *:text-white" v-if="showMenu" @click.stop>
            <slot name="left" width="var(--aside-width)" />
          </div>
        </div>
        <div class="fixed top-0 right-0 w-[--aside-width] h-[100vh] flex items-center" @click="() => {
          if (isInSpace(page + 1, 0, images.length)) page++
          else $emit('nextEp')
        }">
          <div class="use-bg w-full flex-col flex *:text-white" v-if="showMenu" @click.stop>
            <slot name="right" width="var(--aside-width)" />
          </div>
        </div>
        <div class="fixed top-0 use-bg left-0 w-[100vw] h-[3rem] *:text-white flex items-center" v-if="showMenu">
          <div @click="$emit('back')">
            <VanIcon name="close" size="2rem" class=" ml-1" />
          </div>
          <div class="flex flex-col h-full ml-1 w-full">
            <div class="text-[--p-color] text-lg van-ellipsis">{{ comicTitle }}</div>
            <div class="text-sm">{{ epTitle }} ({{ page + 1 }}/{{ images.length }})</div>
          </div>
        </div>
        <div v-if="!showMenu" @click="showMenu = true" class="!fixed top-0 left-0 w-[100vw] h-[3rem]"></div>
        <div v-if="showMenu" class="fixed bottom-0 use-bg left-0 w-[100vw] flex flex-col">
          <VanSlider v-model="selectPage" @change="v => (page != v) && (page = v)" :min="0"
            :max="((images.length - 1) > 0) ? (images.length - 1) : selectPage + 1"
            @drag-start="showSliderButtonNumber = true" @drag-end="showSliderButtonNumber = false"
            class="!w-[calc(100%-1rem)] !mx-2 !my-[calc(var(--van-slider-button-height)/2)]">
            <template #button>
              <div
                class="flex justify-center relative items-center w-[--van-slider-button-width] h-[--van-slider-button-height] rounded-full bg-[--van-background-2] shadow-md">
                <div v-if="showSliderButtonNumber"
                  class="slider-button-number w-6 absolute text-center p-[2px] z-[200000] bottom-[calc(var(--van-slider-button-width)+10px)] use-bg rounded-lg text-white h-5 before:content-[''] before:bg-opacity-50 before:bg-black before:absolute before:left-1/2 before:bottom-0 before:-translate-x-1/2 before:translate-y-1/2 before:rotate-45 before:w-2 before:h-2">
                  {{ selectPage + 1 }}
                </div>
              </div>
            </template>
          </VanSlider>
          <div
            class="h-[3rem] *:text-white justify-evenly flex items-center *:flex *:w-[3rem] *:justify-center *:items-center *:flex-col *:h-[3rem]">
            <slot name="menu" />
            <div @click="showMenu = false">
              <van-icon name="arrow-down" size="2rem" class="-mb-1" />
              收起
            </div>
          </div>
        </div>
        <div v-if="!showMenu" @click="showMenu = true" class="!fixed bottom-0 left-0 w-[100vw] h-[3rem]">
          <div class="h-4 w-auto items-center flex flex-nowrap use-bg text-white absolute bottom-0 pb-1 pl-1 left-0 text-xs"
            @click.stop="app.showDevPupop = true">
            <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32"
              class="w-3 block text-white" v-if="config.value.devMode">
              <path d="M31 16l-7 7l-1.41-1.41L28.17 16l-5.58-5.59L24 9l7 7z" fill="currentColor"></path>
              <path d="M1 16l7-7l1.41 1.41L3.83 16l5.58 5.59L8 23l-7-7z" fill="currentColor"></path>
              <path d="M12.419 25.484L17.639 6l1.932.518L14.35 26z" fill="currentColor"></path>
            </svg>
            {{ epTitle }}
            ({{ page + 1 }}/{{ images.length }})
          </div>
        </div>
      </template>
      <template #image="{ src, style, onLoad }">
        <div :style>
          <Image forever-loop fit="contain" :src v-if="src" class="w-full h-full" hide-loading hide-error @load="e => {
            onLoad(e)
            loadedImagesList.push(src)
          }" />
          <div v-if="!loadedImagesList.includes(src)"
            class="w-[100vw] h-[100vh] text-center text-3xl text-white absolute">
            {{ page + 1 }}
          </div>
        </div>
      </template>
    </VanImagePreview>
    <template v-for="index in config.value.preloadIamgeNumbers">
      <Image :src="images[page - index]" v-if="images[page - index]" class="hidden"
        @load="loadedImagesList.push(images[page - index])" />
      <Image :src="images[page + index]" v-if="images[page + index]" class="hidden"
        @load="loadedImagesList.push(images[page + index])" />
    </template>
  </Teleport>
</template>

<style scoped lang='scss'>
.slider-button-number::before {
  clip-path: polygon(100% 0%,
      100% 100%,
      100% 100%,
      0% 100%);
}

.use-bg {
  @apply bg-black bg-opacity-50;
}
</style>