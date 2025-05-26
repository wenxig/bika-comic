<script setup lang='ts'>
import config from '@/config'
import { useSmallWindowContext } from '@/stores/smallWindow'
import { useDraggable } from '@vueuse/core'
import { noop } from 'lodash-es'
import { FloatingBubbleOffset } from 'vant'
import { reactive, ref, shallowRef } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import 'swiper/css'
import 'swiper/css/virtual'
import 'swiper/css/zoom'
import type { Swiper as SwiperClass } from 'swiper/types/index.d.ts'
import { Virtual, Zoom } from 'swiper/modules'
import { LoaingMask } from './helper'
const ctx = useSmallWindowContext()
const el = ref<HTMLDivElement>()
const windowWidth = window.innerWidth
const viewSize = reactive({
  width: windowWidth * 0.4,
  height: windowWidth * 0.533
})
const { position, isDragging } = useDraggable(el, {
  initialValue: { x: windowWidth / 2, y: window.innerHeight / 4 },
})
let lastMove: { x: number; y: number } | null = null

const MAX_SMALLWINDOW_WIDTH = windowWidth * 0.85
const MIN_SMALLWINDOW_WIDTH = windowWidth * 0.3
const onTouchMove = (event: TouchEvent) => {
  const t = event.touches[0]
  const { clientX: x, clientY: y } = t

  if (!lastMove) {
    lastMove = { x, y }
    return
  }

  const xIv = x - lastMove.x
  const yIv = y - lastMove.y
  const distance = Math.sqrt(xIv ** 2 + yIv ** 2)
  const subtense = (xIv < 0 || yIv < 0) ? -distance : distance

  viewSize.width += subtense
  viewSize.height = viewSize.width / 0.75

  if (viewSize.width >= MAX_SMALLWINDOW_WIDTH) {
    viewSize.width = MAX_SMALLWINDOW_WIDTH
    viewSize.height = MAX_SMALLWINDOW_WIDTH / 0.75
  }

  if (viewSize.width <= MIN_SMALLWINDOW_WIDTH) {
    viewSize.width = MIN_SMALLWINDOW_WIDTH
    viewSize.height = MIN_SMALLWINDOW_WIDTH / 0.75
  }
  lastMove = { x, y }
}
const isResizeing = shallowRef(false)

const isInSmallestMode = shallowRef(false)
const isInAdmin = shallowRef(false)
const offset = ref<FloatingBubbleOffset>({ x: 0, y: 0 })
let timerStoper = noop
const toSmallestMode = () => {
  isInSmallestMode.value = true
  isInAdmin.value = true
  timerStoper()
  const timer = setTimeout(() => {
    console.log('smail animation timer end')
    isInAdmin.value = false
  }, 500)
  timerStoper = () => {
    console.log('smail animation timer stop')
    clearTimeout(timer)
  }
  offset.value = {
    x: windowWidth - 5 - 3 * 16,
    y: position.value.y
  }
}

const toNomralMode = () => {
  isInSmallestMode.value = false
  isInAdmin.value = true
  timerStoper()
  const timer = setTimeout(() => {
    console.log('smail animation timer end')
    isInAdmin.value = false
  }, 500)
  timerStoper = () => {
    console.log('smail animation timer stop')
    clearTimeout(timer)
  }

}
const imageStore = reactive({
  loaded: new Set<string>(),
  error: new Set<string>()
})

const initialSlide = ctx.ctx?.config.begin ?? 0
const swiper = shallowRef<SwiperClass>()
const page = shallowRef(0)
let initTimes = 0
const onInit = async () => {
  if (!initialSlide) return
  const id = setInterval(async () => {
    initTimes++
    if (initTimes > 10) return clearInterval(id)
    swiper.value?.slideTo(initialSlide, 0)
    console.log('sm window init', initialSlide)
    if (page.value == initialSlide) clearInterval(id)
  }, 0)
}
</script>

<template>
  <template v-if="ctx.enable">
    <Transition name="van-fade">
      <div v-if="!isInSmallestMode && ctx.ctx"
        class="rounded-md shadow-lg fixed pointer-events-auto overflow-hidden transition-[transform,opacity]"
        :class="[{ 'border-solid border-[--p-color] border-[3px]': isResizeing }]"
        :style="[{ left: `${position.x - viewSize.width * 0.35}px`, top: `${position.y}px` }, { width: `${isResizeing ? viewSize.width - 6 : viewSize.width}px`, height: `${isResizeing ? viewSize.height - 6 : viewSize.height}px` }]">
        <div
          class="absolute top-0 left-0 w-full h-[9%] van-hairline--bottom flex justify-center bg-[--van-background-3]"
          @contextmenu.prevent.stop="e => e.preventDefault()" :class="[isResizeing && '-translate-y-[3px]']"
          @touchmove.stop.prevent>
          <van-icon name="minus" class="bg-gray-200 absolute top-1/2 -translate-y-1/2 p-[2px] rounded-full"
            :style="{ 'left': `${viewSize.height * 0.027}px` }" :size="viewSize.height * 0.3 * 0.1"
            @click="isInAdmin || toSmallestMode()" />
          <div :class="[isDragging && 'bg-gray-200']" class="rounded-sm h-full w-[30%] flex justify-center items-center"
            ref="el">
            <div class="bg-[--p-color] w-[60%] rounded-full h-[15%] pointer-events-none"></div>
          </div>
          <VanIcon @click="ctx.$close()" name="cross"
            class="bg-gray-200 absolute top-1/2 -translate-y-1/2 p-[2px] rounded-full"
            :style="{ 'right': `${viewSize.height * 0.027}px` }" :size="viewSize.height * 0.3 * 0.1" />
        </div>
        <div class="w-full h-[91%] absolute top-[9%] pointer-events-auto">
          <Swiper :modules="[Virtual, Zoom]" @swiper="sw => swiper = sw" :initialSlide
            @slideChange="sw => page = sw.activeIndex" :slidesPerView="config['bika.read.twoImage'] ? 2 : 1"
            class="w-[100%] h-[100%] bg-black" virtual @init="onInit" zoom>
            <SwiperSlide v-for="(src, index) of ctx.ctx.images" :key="index" :virtualIndex="index"
              :data-hash="index + 1" class="overflow-hidden">
              <Image infiniteRetry fit="contain" :use-list="imageStore" :src
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
        </div>
        <div class="bg-[--p-color] size-6 absolute bottom-0 z-10 right-0 rotate-45 translate-x-1/2 translate-y-1/2"
          @touchstart.stop.prevent="isResizeing = true; lastMove = null"
          @touchend.stop.prevent="isResizeing = false; lastMove = null" @touchmove.stop.prevent="onTouchMove"
          @contextmenu.prevent.stop="e => e.preventDefault()"></div>
      </div>
    </Transition>
    <Transition name="van-fade" appear-to-class="!translate-x-0 !opacity-100"
      appear-from-class="!-translate-x-full !opacity-0" appear-active-class="transition-[transform,opacity]">
      <van-floating-bubble :gap="5" axis="xy" icon="chat" magnetic="x" v-model:offset="offset" @click="toNomralMode"
        v-show="isInSmallestMode" v-if="ctx.ctx"
        class="bg-[--van-background-3] border-[2px] border-solid border-[--van-border-color] shadow-lg pointer-events-auto"
        :teleport="null">
        <Image fit="cover" :src="ctx.ctx.icon" />
      </van-floating-bubble>
    </Transition>
  </template>
</template>