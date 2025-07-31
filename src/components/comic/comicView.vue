<script setup lang='ts'>
import { ComicPage } from '@/stores/comic'
import { Swiper, SwiperSlide } from 'swiper/vue'
import 'swiper/css'
import 'swiper/css/virtual'
import 'swiper/css/zoom'
import { Swiper as SwiperClass } from 'swiper'
import { Virtual, Zoom, HashNavigation, } from 'swiper/modules'
import { computed, onUnmounted, shallowRef, watch } from 'vue'
import { useConfig } from '@/config'
import { Page } from '@/api/bika/comic'
import { AutoPlayConfig, baseAutoPlayConfig, LoadingMask, MenuButton } from './comicView.helper'
import { inRange } from 'lodash-es'
import { useMessage } from 'naive-ui'
import { useRoute } from 'vue-router'
import { triggerRef } from 'vue'
import { useClipboard } from '@vueuse/core'
import FloatPopup from '../floatPopup.vue'
import AutoPlaySetter from './autoPlaySetter.vue'
const $props = withDefaults(defineProps<{
  comic: ComicPage
  nowEpId: string
  pages: Page[]
  startPosition?: number
}>(), {
  startPosition: 0
})
const $message = useMessage()
const config = useConfig()
const $route = useRoute()
const copier = useClipboard({ legacy: true })
const swiper = shallowRef<SwiperClass>()

const images = computed(() => $props.pages.map(v => v.$media))
const comic = computed(() => $props.comic.detail.content.value.data)
const eps = computed(() => $props.comic.eps.content.value.data)
const nowEp = computed(() => eps.value?.find(v => v.id == $props.nowEpId))

const selectPage = shallowRef(Number($route.hash.substring(1)) - 1)
const page = shallowRef(selectPage.value || 0)
const initialSlide = isNaN($props.startPosition) ? 0 : $props.startPosition
let initTimes = 0
const onInit = async () => {
  if (!initialSlide) return
  const id = setInterval(async () => {
    initTimes++
    if (initTimes > 10) return clearInterval(id)
    swiper.value?.slideTo(initialSlide, 0)
    if (page.value == initialSlide) clearInterval(id)
  }, 0)
}

const showMenu = shallowRef(false)
const settingShow = shallowRef(false)
const showSliderButtonNumber = shallowRef(false)
const settingPage = shallowRef<InstanceType<typeof FloatPopup>>()

// autoPlay
const showAutoPlayPopup = shallowRef(false)
const pausedAutoPlay = shallowRef(false)
let autoPlayTimerId = NaN
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


defineExpose({
  index: page,
  toIndex(index: number) {
    swiper.value?.slideTo(index)
  }
})
</script>

<template>
  <Swiper :modules="[Virtual, Zoom, HashNavigation]" @swiper="sw => swiper = sw" :initialSlide
    :slidesPerView="config['bika.read.twoImage'] ? 2 : 1" @slideChange="sw => page = sw.activeIndex"
    class="w-[100vw] h-[100vh] !fixed !top-0 bg-black" virtual @init="onInit" zoom
    :direction="config['bika.read.vertical'] ? 'vertical' : 'horizontal'" :hashNavigation="{ replaceState: true }"
    :dir="config['bika.read.rtl'] ? 'rtl' : 'ltr'">
    <SwiperSlide v-for="(image, index) of images" :key="index" :virtualIndex="index" :data-hash="index + 1"
      class="overflow-hidden">
      <Image fetchpriority="high" infiniteRetry fit="contain" :src="image" class="w-full h-full swiper-zoom-container">
        <template #loading>
          <LoadingMask :index="index + 1" />
        </template>
        <template #fail>
          <LoadingMask :index="index + 1" />
        </template>
      </Image>
    </SwiperSlide>
  </Swiper>

  <div class="fixed z-1 top-0 left-0 w-(--aside-width) h-[100vh] flex items-center"
    @click="inRange(page - 1, 0, images.length) ? swiper?.slidePrev() : $emit('lastEp')">
    <Transition name="van-slide-left">
      <div class="w-full flex-col flex *:text-white" v-show="showMenu" @click.stop>
        <slot :MenuButton name="left" width="var(--aside-width)" />
      </div>
    </Transition>
  </div>

  <div class="fixed z-1 top-0 right-0 w-(--aside-width) h-[100vh] flex items-center"
    @click="inRange(page + 1, 0, images.length) ? swiper?.slideNext() : $emit('nextEp')">
    <Transition name="van-slide-right">
      <div class="w-full flex-col flex *:text-white" v-show="showMenu" @click.stop>
        <slot :MenuButton name="right" width="var(--aside-width)" />
      </div>
    </Transition>
  </div>

  <Transition name="van-slide-down">
    <div class="fixed z-1 top-0 use-bg left-0 w-[100vw] h-[3rem] *:text-white flex items-center" v-if="showMenu">
      <div @click="$emit('back')">
        <VanIcon name="close" size="2rem" class=" ml-1" />
      </div>
      <div class="flex flex-col h-full ml-1 w-full">
        <div class="text-(--p-color) text-lg van-ellipsis">{{ comic?.title }}</div>
        <div class="text-sm">{{ nowEp?.title }} ({{ (page + 1) || 1 }}/{{ images.length }})</div>
      </div>
    </div>
  </Transition>
  <div v-if="!showMenu" @click="showMenu = true" class="!fixed z-1 top-0 left-0 w-[100vw] h-[3rem]"></div>


  <Transition name="van-slide-up">
    <div v-show="showMenu" class="fixed z-1 bottom-0 use-bg left-0 w-[100vw] flex flex-col">
      <VanSlider v-model="selectPage" @change="v => (page != v) && swiper?.slideTo(v, 0)" :min="0"
        :max="((images.length - 1) > 0) ? (images.length - 1) : selectPage + 1"
        @drag-start="showSliderButtonNumber = true" @drag-end="showSliderButtonNumber = false"
        class="!w-[calc(100%-1rem)] !mx-2 !my-[calc(var(--van-slider-button-height)/2)]">
        <template #button>
          <div
            class="flex justify-center relative items-center w-(--van-slider-button-width) h-(--van-slider-button-height) rounded-full bg-(--van-background-2) shadow-md">
            <div v-if="showSliderButtonNumber"
              class="slider-button-number w-6 absolute text-center p-[2px] z-200000 bottom-[calc(var(--van-slider-button-width)+10px)] use-bg rounded-lg text-white h-5 before:content-[''] before:bg-opacity-50 before:bg-black before:absolute before:left-1/2 before:bottom-0 before:-translate-x-1/2 before:translate-y-1/2 before:rotate-45 before:w-2 before:h-2">
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
    <div v-show="!showMenu" @click="showMenu = true" class="!fixed z-1 bottom-0 left-0 w-[100vw] h-[3rem]">
      <div class="h-4 w-auto items-center flex flex-nowrap use-bg text-white absolute bottom-0 px-1 left-0 text-xs">
        {{ nowEp?.title }}
        ({{ (page + 1) || 1 }}/{{ images.length }})
      </div>
    </div>
  </Transition>
  <Transition name="van-slide-up" v-if="!showMenu">
    <NButton type="primary" v-show="autoPlayConfig.enable" class="absolute bottom-[20px] block left-1 z-1" round
      size="tiny" @click="pausedAutoPlay = !pausedAutoPlay">
      <span v-if="pausedAutoPlay">
        自动翻页停
        <VanIcon name="pause" />
      </span>
      <span v-else>
        自动翻页中
        <VanIcon name="arrow-double-right" class="loop-fade-animation" />
      </span>
    </NButton>
  </Transition>
  <!-- 设置 -->
  <Popup v-model:show="settingShow" class="h-1/2" position="bottom" round>
    <VanCellGroup>
      <VanCell title="自动翻页" icon="play-circle-o" clickable @click="showAutoPlayPopup = true"></VanCell>

      <!-- <VanCell :title="app.favourtImages.find(v => v.src == images[page]) ? '从图片收藏移除' : '添加至图片收藏'"
        :icon="app.favourtImages.find(v => v.src == images[page]) ? 'minus' : 'plus'" clickable @click="() => {
          app.favourtImages.find(v => v.src == images[page])
            ? $emit('removeFavourtImage', images[page])
            : $emit('addFavourtImage', images[page], Date.now())
        }">
      </VanCell> -->
      <VanCell title="复制图片地址" icon="records-o" clickable
        @click="copier.copy(images[page].getUrl()).then(() => $message.success('成功复制！'))">
      </VanCell>
      <!-- <VanCell title="全屏" icon="enlarge" clickable @click="fullscreen.enter()"></VanCell>
      <VanCell title="小窗播放" icon="shrink" v-if="config['bika.smallWindow.enable']" clickable @click="openSmWindow">
      </VanCell> -->
      <VanCell center title="垂直阅读">
        <template #right-icon>
          <VanSwitch v-model="config['bika.read.vertical']" />
        </template>
      </VanCell>
      <VanCell center title="单页显示两张">
        <template #right-icon>
          <VanSwitch v-model="config['bika.read.twoImage']" />
        </template>
      </VanCell>
      <VanCell center title="反向阅读">
        <template #right-icon>
          <VanSwitch v-model="config['bika.read.rtl']" disabled />
        </template>
      </VanCell>
      <VanCell title="更多" icon="more-o" clickable @click="settingPage?.show()"></VanCell>
    </VanCellGroup>
  </Popup>
  <FloatPopup overlay anchors="high" ref="settingPage">
    <!-- <SettingPage hideNavbar /> -->
  </FloatPopup>
  <template v-for="index in config['bika.read.preloadImageNumbers']">
    <Image :src="images[page - index]" v-if="images[page - index]" class="hidden" />
    <Image :src="images[page + index]" v-if="images[page + index]" class="hidden" />
  </template>

  <Popup v-model:show="showAutoPlayPopup" position="bottom" round>
    <AutoPlaySetter
      @submit="v => { setAutoPlayConfig(v);  showAutoPlayPopup = false }" />
  </Popup>
</template>