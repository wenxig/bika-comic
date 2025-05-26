<script setup lang='ts'>
import { Swiper, SwiperSlide } from 'swiper/vue'
import 'swiper/css'
import 'swiper/css/virtual'
import 'swiper/css/zoom'
import type { Swiper as SwiperClass } from 'swiper/types/index.d.ts'
import { Virtual, Zoom, HashNavigation, } from 'swiper/modules'
import { onUnmounted, reactive, shallowRef, watch } from 'vue'
import { inRange, isNaN } from 'lodash-es'
import config, { fullscreen } from '@/config'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores'
import SettingPage from '@/page/setting.vue'
import { Icon as VanIcon } from 'vant'
import FloatPopup from '@/components/floatPopup.vue'
import { useSmallWindowContext } from '@/stores/smallWindow'
import { Image_ } from '@/utils/image'
import { AutoPlayConfig, baseAutoPlayConfig, LoaingMask, MenuButton } from './helper'
import { useClipboard } from '@vueuse/core'
import { triggerRef } from 'vue'
const $props = withDefaults(defineProps<{
  images: string[],
  startPosition?: number,
  comicTitle?: string,
  epTitle?: string,
  moreSetting?: {}[],
  cover?: Image_
}>(), {
  moreSetting: [] as any,
  show: true,
  startPosition: NaN,
})
const $route = useRoute()
const showMenu = shallowRef(false)
const settingShow = shallowRef(false)
const selectPage = shallowRef(Number($route.hash.substring(1)) - 1)
const showSliderButtonNumber = shallowRef(false)
const app = useAppStore()
const swiper = shallowRef<SwiperClass>()
const $emit = defineEmits<{
  lastEp: []
  nextEp: []
  back: []
  addFavourtImage: [src: string, time: number]
  removeFavourtImage: [src: string]
}>()
const slots = defineSlots<{
  menu(arg: { MenuButton: typeof MenuButton }): any
  left(arg: { width: string, MenuButton: typeof MenuButton }): any
  right(arg: { width: string, MenuButton: typeof MenuButton }): any
}>()
const page = shallowRef(selectPage.value || 0)
watch(page, page => selectPage.value = page)
const full = () => config.value['bika.read.watchFullscreen'] ? fullscreen.enter() : fullscreen.exit()
fullscreen.isSupported.value && config.value['bika.read.watchFullscreen'] && full()
onBeforeRouteLeave(() => fullscreen.isSupported.value && fullscreen.exit())
const imageStore = reactive({
  loaded: new Set<string>(),
  error: new Set<string>()
})
window.$api.swiper = swiper
const initialSlide = isNaN($props.startPosition) ? 0 : $props.startPosition
console.log(`init page index:`, initialSlide)
let initTimes = 0
const onInit = async () => {
  if (!initialSlide) return
  const id = setInterval(async () => {
    initTimes++
    if (initTimes > 10) return clearInterval(id)
    swiper.value?.slideTo(initialSlide, 0)
    console.log('view init', initialSlide)
    if (page.value == initialSlide) clearInterval(id)
  }, 0)
}
defineExpose({
  index: page,
  toIndex(index: number) {
    swiper.value?.slideTo(index)
  }
})
watch(() => config.value, () => {
  swiper.value?.update()
  swiper.value?.slideTo(page.value)
}, { flush: 'post' })

const floatPopup = shallowRef<InstanceType<typeof FloatPopup>>()

const $router = useRouter()
const smw = useSmallWindowContext()
const openSmWindow = () => {
  smw.$open($props.images, $props.cover ?? $props.images[0], () => {
    $router.force.push($route.fullPath)
  }, {
    begin: page.value
  })
}
const $window = window
const copier = useClipboard({ legacy: true })

// autoPlay
const showAutoPlayPopup = shallowRef(false)
const pausedAutoPlay = shallowRef(false)
watch(pausedAutoPlay, pausedAutoPlay => {
  if (pausedAutoPlay) {
    if (!isNaN(autoPlayTimerId)) {
      clearInterval(autoPlayTimerId)
    }
  } else if (autoPlayConfig.value.enable) {
    const id = setInterval(() => {
      if (autoPlayConfig.value.reverse) swiper.value?.slidePrev()
      else swiper.value?.slideNext()
    }, autoPlayConfig.value.speedSecond * 1000)
    autoPlayTimerId = id
    console.log('autoPlayTimerId', autoPlayTimerId)
  }
})
const autoPlayConfig = shallowRef<AutoPlayConfig>(baseAutoPlayConfig)
let autoPlayTimerId = NaN
const setAutoPlayConfig = (v: AutoPlayConfig) => {
  autoPlayConfig.value = v
  if (!isNaN(autoPlayTimerId)) {
    clearInterval(autoPlayTimerId)
  }
  pausedAutoPlay.value = false
  triggerRef(pausedAutoPlay)
}
onUnmounted(() => {
  setAutoPlayConfig(baseAutoPlayConfig)
  if (!isNaN(autoPlayTimerId)) {
    clearInterval(autoPlayTimerId)
  }
})
</script>

<template>
  <Teleport to="#comic-views">
    <Swiper :modules="[Virtual, Zoom, HashNavigation]" @swiper="sw => swiper = sw" :initialSlide
      :slidesPerView="config['bika.read.twoImage'] ? 2 : 1" @slideChange="sw => page = sw.activeIndex"
      class="w-[100vw] h-[100vh] !fixed !top-0 bg-black" virtual @init="onInit" zoom
      :direction="config['bika.read.vertical'] ? 'vertical' : 'horizontal'" :hashNavigation="{ replaceState: true }"
      :dir="config['bika.read.rtl'] ? 'rtl' : 'ltr'">
      <SwiperSlide v-for="(src, index) of images" :key="index" :virtualIndex="index" :data-hash="index + 1"
        class="overflow-hidden">
        <Image fetchpriority="high" infiniteRetry fit="contain" :use-list="imageStore" :src
          class="w-full h-full swiper-zoom-container">
          <template #loading>
            <LoaingMask :index="index + 1" />
          </template>
          <template #fail>
            <LoaingMask :index="index + 1" />
          </template>
        </Image>
      </SwiperSlide>
    </Swiper>

    <div class="fixed z-[1] top-0 left-0 w-[--aside-width] h-[100vh] flex items-center"
      @click="inRange(page - 1, 0, images.length) ? swiper?.slidePrev() : $emit('lastEp')">
      <Transition name="van-slide-left">
        <div class="w-full flex-col flex *:text-white" v-show="showMenu" @click.stop>
          <slot :MenuButton name="left" width="var(--aside-width)" />
        </div>
      </Transition>
    </div>

    <div class="fixed z-[1] top-0 right-0 w-[--aside-width] h-[100vh] flex items-center"
      @click="inRange(page + 1, 0, images.length) ? swiper?.slideNext() : $emit('nextEp')">
      <Transition name="van-slide-right">
        <div class="w-full flex-col flex *:text-white" v-show="showMenu" @click.stop>
          <slot :MenuButton name="right" width="var(--aside-width)" />
        </div>
      </Transition>
    </div>

    <Transition name="van-slide-down">
      <div class="fixed z-[1] top-0 use-bg left-0 w-[100vw] h-[3rem] *:text-white flex items-center" v-if="showMenu">
        <div @click="$emit('back')">
          <VanIcon name="close" size="2rem" class=" ml-1" />
        </div>
        <div class="flex flex-col h-full ml-1 w-full">
          <div class="text-[--p-color] text-lg van-ellipsis">{{ comicTitle }}</div>
          <div class="text-sm">{{ epTitle }} ({{ (page + 1) || 1 }}/{{ images.length }})</div>
        </div>
      </div>
    </Transition>
    <div v-if="!showMenu" @click="showMenu = true" class="!fixed z-[1] top-0 left-0 w-[100vw] h-[3rem]"></div>


    <Transition name="van-slide-up">
      <div v-show="showMenu" class="fixed z-[1] bottom-0 use-bg left-0 w-[100vw] flex flex-col">
        <VanSlider v-model="selectPage" @change="v => (page != v) && swiper?.slideTo(v, 0)" :min="0"
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
          <slot name="menu" :MenuButton />
          <MenuButton withBg @click="settingShow = true" icon="more-o">
            更多
          </MenuButton>
          <MenuButton withBg @click="showMenu = false" icon="arrow-down">
            收起
          </MenuButton>
        </div>
      </div>
    </Transition>

    <Transition name="van-slide-up">
      <div v-show="!showMenu" @click="showMenu = true" class="!fixed z-[1] bottom-0 left-0 w-[100vw] h-[3rem]">
        <div class="h-4 w-auto items-center flex flex-nowrap use-bg text-white absolute bottom-0 px-1 left-0 text-xs"
          @click.stop="app.showDevPupop = true">
          <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32"
            class="w-3 block text-white" v-if="config['bika.devMode']">
            <path d="M31 16l-7 7l-1.41-1.41L28.17 16l-5.58-5.59L24 9l7 7z" fill="currentColor"></path>
            <path d="M1 16l7-7l1.41 1.41L3.83 16l5.58 5.59L8 23l-7-7z" fill="currentColor"></path>
            <path d="M12.419 25.484L17.639 6l1.932.518L14.35 26z" fill="currentColor"></path>
          </svg>
          {{ epTitle }}
          ({{ (page + 1) || 1 }}/{{ images.length }})
        </div>
      </div>
    </Transition>
    <Transition name="van-slide-up" v-if="!showMenu">
      <NButton type="primary" v-show="autoPlayConfig.enable" class="absolute bottom-[20px] block left-1 z-[1]" round
        size="tiny" @click="pausedAutoPlay = !pausedAutoPlay">
        <span v-if="pausedAutoPlay">
          自动翻页停
          <van-icon name="pause" />
        </span>
        <span v-else>
          自动翻页中
          <van-icon name="arrow-double-right" class="loop-fade-animation" />
        </span>
      </NButton>
    </Transition>
  </Teleport>
  <!-- 设置 -->
  <Popup v-model:show="settingShow" class="h-1/2" position="bottom" round>
    <van-cell-group>
      <VanCell title="自动翻页" icon="play-circle-o" clickable @click="showAutoPlayPopup = true"></VanCell>

      <VanCell :title="app.favourtImages.find(v => v.src == images[page]) ? '从图片收藏移除' : '添加至图片收藏'"
        :icon="app.favourtImages.find(v => v.src == images[page]) ? 'minus' : 'plus'" clickable @click="() => {
          app.favourtImages.find(v => v.src == images[page])
            ? $emit('removeFavourtImage', images[page])
            : $emit('addFavourtImage', images[page], Date.now())
        }">
      </VanCell>
      <VanCell title="复制图片地址" icon="records-o" clickable
        @click="copier.copy(images[page]).then(() => $window.$message.success('成功复制！'))">
      </VanCell>
      <VanCell title="全屏" icon="enlarge" clickable @click="fullscreen.enter()"></VanCell>
      <VanCell title="小窗播放" icon="shrink" v-if="config['bika.smallWindow.enable']" clickable @click="openSmWindow">
      </VanCell>
      <van-cell center title="垂直阅读">
        <template #right-icon>
          <van-switch v-model="config['bika.read.vertical']" />
        </template>
      </van-cell>
      <van-cell center title="单页显示两张">
        <template #right-icon>
          <van-switch v-model="config['bika.read.twoImage']" />
        </template>
      </van-cell>
      <van-cell center title="反向阅读">
        <template #right-icon>
          <van-switch v-model="config['bika.read.rtl']" disabled />
        </template>
      </van-cell>
      <VanCell title="更多" icon="more-o" clickable @click="floatPopup?.show()"></VanCell>
    </van-cell-group>
  </Popup>
  <FloatPopup overlay anchors="high" ref="floatPopup">
    <SettingPage hideNavbar />
  </FloatPopup>
  <template v-for="index in config['bika.read.preloadIamgeNumbers']">
    <Image :use-list="imageStore" :src="images[page - index]" v-if="images[page - index]" class="hidden" />
    <Image :use-list="imageStore" :src="images[page + index]" v-if="images[page + index]" class="hidden" />
  </template>

  <Popup v-model:show="showAutoPlayPopup" position="bottom" round>
    <AutoPlay
      @submit="v => { setAutoPlayConfig(v); console.log('<comicView> handle <AutoPlay> submit event', v); showAutoPlayPopup = false }" />
  </Popup>

</template>

<style scoped lang='scss'>
:deep(*),
* {
  --aside-width: 13vw;
}

.slider-button-number::before {
  clip-path: polygon(100% 0%,
      100% 100%,
      100% 100%,
      0% 100%);
}

.use-bg {
  @apply bg-black bg-opacity-50;
}

@keyframes fade-loop {
  0% {
    opacity: 1;
  }

  50% {
    opacity: 0.6;
  }

  100% {
    opacity: 1;
  }
}

.loop-fade-animation {
  animation-name: fade-loop;
  animation-direction: alternate;
  animation-timing-function: linear;
  animation-delay: 0s;
  animation-iteration-count: infinite;
  animation-duration: 1s;
}
</style>