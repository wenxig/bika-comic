<script setup lang='tsx'>
import config, { fullscreen } from '@/config'
import { computedWithControl } from '@vueuse/core'
import { ImagePreviewInstance } from 'vant'
import { watch, shallowRef, FunctionalComponent, reactive } from 'vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'
import { useAppStore } from '@/stores'
import { inRange } from 'lodash-es'
const showMenu = shallowRef(false)
const app = useAppStore()
const $route = useRoute()
interface Setting {

}
const $props = withDefaults(defineProps<{
  images: string[],
  startPosition?: number,
  comicTitle?: string,
  epTitle?: string,
  show?: boolean,
  moreSetting?: Setting[]
}>(), {
  moreSetting: [] as any,
  show: true,
  startPosition: 0
})
defineEmits<{
  lastEp: []
  nextEp: []
  back: []
  addFavourtImage: [src: string, time: number]
  removeFavourtImage: [src: string]
}>()

const page = shallowRef($props.startPosition)
const selectPage = shallowRef(Number($route.hash.substring(1)) - 1)
watch(page, page => selectPage.value = page)
const showSliderButtonNumber = shallowRef(false)
const LoaingMask: FunctionalComponent<{ index: number }> = ({ index }) => (<div class="w-[100vw] h-[100vh] text-center flex justify-center items-center"><span class="text-3xl text-white">{index}</span></div>)

const imagePreview = shallowRef<ImagePreviewInstance>()
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


const full = () => config.value['bika.read.watchFullscreen'] ? fullscreen.enter() : fullscreen.exit()
watch(() => $props.show, show => fullscreen.isSupported.value && config.value['bika.read.watchFullscreen'] && show && full(), { immediate: true })
onBeforeRouteLeave(() => fullscreen.isSupported.value && fullscreen.exit())


defineSlots<{
  menu(): any
  left(arg: { width: string }): any
  right(arg: { width: string }): any
}>()
defineExpose({
  index: page,
  toIndex(index: number) {
    page.value = index
  }
})
const imageStore = reactive({
  loaded: new Set<string>(),
  error: new Set<string>()
})
// 设置
const settingShow = shallowRef(false)
</script>

<template>
  <Teleport to="#comic-views">
    <VanImagePreview :max-zoom="Infinity" :vertical="config.value['bika.read.vertical']" :show
      v-if="show && !config.value['bika.read.vertical']" :images="showImages" :close-on-click-image="false"
      :close-on-click-overlay="false" :close-on-popstate="false" :loop="false" :show-index="false" ref="imagePreview"
      @change="i => setPage(i - (!!getValue(-1) ? 1 : 0))" style="--aside-width:15vw;" class="!z-[0]"
      overlay-class="!z-[0]">
      <template #cover>
        <div class="fixed top-0 left-0 w-[--aside-width] h-[100vh] flex items-center"
          @click="inRange(page - 1, 0, images.length) ? page-- : $emit('lastEp')">
          <div class="use-bg w-full flex-col flex *:text-white" v-if="showMenu" @click.stop>
            <slot name="left" width="var(--aside-width)" />
          </div>
        </div>
        <div class="fixed top-0 right-0 w-[--aside-width] h-[100vh] flex items-center"
          @click="inRange(page + 1, 0, images.length) ? page++ : $emit('nextEp')">
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
            <div @click="settingShow = true">
              <van-icon name="more-o" size="2rem" class="-mb-1" />
              更多
            </div>
            <div @click="showMenu = false">
              <van-icon name="arrow-down" size="2rem" class="-mb-1" />
              收起
            </div>
          </div>
        </div>
        <div v-if="!showMenu" @click="showMenu = true" class="!fixed bottom-0 left-0 w-[100vw] h-[3rem]">
          <div
            class="h-4 w-auto items-center flex flex-nowrap use-bg text-white absolute bottom-0 px-1 left-0 text-xs"
            @click.stop="app.showDevPupop = true">
            <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32"
              class="w-3 block text-white" v-if="config.value['bika.devMode']">
              <path d="M31 16l-7 7l-1.41-1.41L28.17 16l-5.58-5.59L24 9l7 7z" fill="currentColor"></path>
              <path d="M1 16l7-7l1.41 1.41L3.83 16l5.58 5.59L8 23l-7-7z" fill="currentColor"></path>
              <path d="M12.419 25.484L17.639 6l1.932.518L14.35 26z" fill="currentColor"></path>
            </svg>
            {{ epTitle }}
            ({{ page + 1 }}/{{ images.length }})
          </div>
        </div>
      </template>
      <template #image="{ src: _src, style, onLoad }">
        <div :style class="flex flex-nowrap flex-shrink-0 flex-grow-0">
          <template v-if="config.value['bika.read.twoImage']">
            <Image infiniteRetry fit="contain" :use-list="imageStore" :src class="w-full h-full" @load="onLoad"
              v-for="src of (config.value['bika.read.twoImage.unsortImage'] ? [showImages[showImages.indexOf(_src) + 1], _src] : [_src, showImages[showImages.indexOf(_src) + 1]]).filter(Boolean)">
              <template #loading>
                <LoaingMask :index="page + 1" />
              </template>
              <template #fail>
                <LoaingMask :index="page + 1" />
              </template>
            </Image>
          </template>
          <Image infiniteRetry fit="contain" :use-list="imageStore" :src="_src" class="w-full h-full" @load="onLoad"
            v-else>
            <template #loading>
              <LoaingMask :index="page + 1" />
            </template>
            <template #fail>
              <LoaingMask :index="page + 1" />
            </template>
          </Image>
        </div>
      </template>
    </VanImagePreview>
    <!-- <div v-else class="w-full h-full overflow-y-auto">
      <Image infiniteRetry fit="contain" :use-list="imageStore" v-for="(src, index) of images" :src class="w-full">
        <template #loading>
          <LoaingMask :index="index + 1" />
        </template>
        <template #fail>
          <LoaingMask :index="index + 1" />
        </template>
      </Image>
    </div> -->

    <!-- 设置 -->
    <Popup v-model:show="settingShow" class="h-1/2" position="bottom" round>
      <van-cell-group>
        <div class="van-cell van-haptics-feedback" @click="() => {
          app.favourtImages.value.find(v => v.src == images[page])
            ? $emit('removeFavourtImage', images[page])
            : $emit('addFavourtImage', images[page], Date.now())
        }">
          <van-icon :name="app.favourtImages.value.find(v => v.src == images[page]) ? 'minus' : 'plus'"
            class="van-cell__left-icon" />
          {{ app.favourtImages.value.find(v => v.src == images[page]) ? '从图片收藏移除' : '添加至图片收藏' }}
        </div>
        <VanCell title="全屏" icon="enlarge" clickable @click="fullscreen.enter()"></VanCell>
        <van-cell center title="垂直阅读">
          <template #right-icon>
            <van-switch v-model="config.value['bika.read.vertical']" disabled />
          </template>
        </van-cell>
        <van-cell center title="单页显示两张">
          <template #right-icon>
            <van-switch v-model="config.value['bika.read.twoImage']" />
          </template>
        </van-cell>
        <van-cell center title="交换页面图片" v-if="config.value['bika.read.twoImage']">
          <template #right-icon>
            <span class="!text-xs text-[--van-text-color-3] mr-1">仅双页阅读模式</span>
            <van-switch v-model="config.value['bika.read.twoImage.unsortImage']" />
          </template>
        </van-cell>
      </van-cell-group>
    </Popup>
    <template v-for="index in config.value['bika.read.preloadIamgeNumbers']">
      <Image :use-list="imageStore" :src="images[page - index]" v-if="images[page - index]" class="hidden" />
      <Image :use-list="imageStore" :src="images[page + index]" v-if="images[page + index]" class="hidden" />
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