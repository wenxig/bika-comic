<script setup lang='ts'>
import { Ep, Page, ProComic, ProPlusMaxComic } from '@/api'
import { Swiper, SwiperSlide } from 'swiper/vue'
import 'swiper/css'
import 'swiper/css/virtual'
import 'swiper/css/zoom'
import type { Swiper as SwiperClass } from 'swiper/types/index.d.ts'
import { Virtual, Zoom, Keyboard } from 'swiper/modules'
import { computed, reactive, ref, shallowRef, watch } from 'vue'
import { isEmpty } from 'lodash-es'
import { toReactive, useTimeoutFn } from '@vueuse/core'
import symbol from '@/symbol'
import { useComicStore } from '@/stores/comic'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import { brushComic } from '@/stores/temp'
import { useAppStore } from '@/stores'
import {  Subscribe } from '@/api/plusPlan'
import { createLoadingMessage } from '@/utils/message'
const swEl = shallowRef<InstanceType<typeof Swiper>>()
const swiper = computed<SwiperClass | undefined>(() => swEl.value?.$el?.swiper)
const index = computed(() => swiper.value?.realIndex || 0)
const $props = withDefaults(defineProps<{
  comic: ProComic
  eps?: Promise<Ep[]>
  info?: Promise<ProPlusMaxComic | false>
  firstPages?: Promise<Page[]>
  showCover?: boolean
  showMenu?: boolean
}>(), {
  showMenu: true
})
const $router = useRouter()
const $emit = defineEmits<{
  comment: []
  sendComment: []
  sub: [authors: string[]]
  info: [info: Promise<ProPlusMaxComic | false>]
  click: []
  dbclick: []
}>()
const selectEp = shallowRef(1)

const firstPages = shallowRef<Page[]>([])
watch(() => $props.firstPages, v => v?.then(v => firstPages.value = v), { immediate: true })
const otherPages = shallowRef<Page[]>([])

const eps = shallowRef<Ep[]>([])
watch(() => $props.eps, v => v?.then(v => eps.value = v), { immediate: true })

const info = ref<ProPlusMaxComic | false>()
watch(() => $props.info, v => v?.then(v => info.value = v), { immediate: true })

const pages = computed(() => selectEp.value - 1 ? otherPages.value : firstPages.value)

const imageStore = reactive({
  loaded: new Set<string>(),
  error: new Set<string>()
})
const comicReactive = toReactive($props.comic)
const authors = computed(() => $props.comic.author.split(symbol.splitAuthorRegexp))
const selectPage = shallowRef(index.value)
watch(index, index => selectPage.value = index)
const showSliderButtonNumber = shallowRef(false)

const comicStore = useComicStore()
const toComicPage = async (url: string) => {
  if ($props.info) comicStore.$setupComic(await $props.info)
  else comicStore.$setupPreload($props.comic)
  return $router.force.push(url)
}
onBeforeRouteLeave(() => void (brushComic.page = index.value))
const initialSlide = brushComic.page
const app = useAppStore()
const isChangingSb = shallowRef(false)
const sb = async () => {
  if (isChangingSb.value) return
  const a = authors.value[0]
  isChangingSb.value = true
  if (app.subscribes.find(v => v.name == a)) {
    const loading = createLoadingMessage('删除中')
    await loading.bind(Subscribe.remove([a]))
  }
  else {
    const loading = createLoadingMessage('订阅中')
    await loading.bind(Subscribe.add([{
      id: a,
      name: a,
      type: 'anthor'
    }]))
  }
}
const isScale = computed(() => swiper.value?.zoom.scale != 1)
watch(isScale, isScale => isScale ? swiper.value?.disable() : swiper.value?.enable())

const clickTimeout = useTimeoutFn(() => {
  // c
  $emit('click')
}, 100, { immediate: false })
const handleDbClick = () => {
  clickTimeout.stop()
  // dbc
  $emit('dbclick')
}
const handleClick = () => {
  clickTimeout.stop()
  clickTimeout.start()
}
defineExpose({
  isScale
})
</script>

<template>
  <NResult status="error" title="错误" description="审核中" v-if="info == false"
    class="!w-full !h-full bg-black !text-white !flex !flex-col !items-center !justify-center" />
  <NSpin show v-else-if="isEmpty(pages) || showCover" class="!w-full !h-full *:!w-full *:!h-full swiper-zoom-container">
    <Image infiniteRetry fit="contain" :use-list="imageStore" :src="comic.thumb" class="w-full h-full" />
  </NSpin>
  <Swiper :modules="[Virtual, Zoom, Keyboard]" :initialSlide virtual :zoom="{ maxRatio: Infinity, toggle: false }"
    @double-click="handleDbClick" keyboard v-else ref="swEl" @click="handleClick"
    class="w-full h-full !relative !top-0 bg-black">
    <SwiperSlide v-for="({ media: src }, index) of pages" :key="index" :virtualIndex="index" :data-hash="index + 1"
      class="overflow-hidden w-full h-full">
      <Image infiniteRetry fit="contain" :use-list="imageStore" :src class="w-full h-full swiper-zoom-container">
        <template #loading>
          <div class="w-[100vw] h-[100vh] text-center flex justify-center items-center">
            <span class="text-3xl text-white">{{ index + 1 }}</span>
          </div>
        </template>
        <template #fail>
          <div class="w-[100vw] h-[100vh] text-center flex justify-center items-center">
            <span class="text-3xl text-white">{{ index + 1 }}</span>
          </div>
        </template>
      </Image>
    </SwiperSlide>
  </Swiper>

  <div class="absolute top-0 left-0 !text-white w-full h-full z-[2] pointer-events-none" v-if="showMenu"
    style="--footer-height:50px;--aside-width:40px">
    <div class="absolute left-0 bottom-0 w-full h-[--footer-height] flex flex-col bg-black bg-opacity-30">
      <!-- footer -->
      <VanSlider v-model="selectPage" @change="v => (index != v) && swiper?.slideTo(v, 0)" :min="0"
        :max="((pages.length - 1) > 0) ? (pages.length - 1) : selectPage + 1"
        @drag-start="showSliderButtonNumber = true" @drag-end="showSliderButtonNumber = false"
        active-color="rgba(255,255,255,0.7)" inactive-color="rgba(120,120,120,0.7)" class="!w-[calc(100%-1rem)] !mx-2">
        <template #button>
          <button
            class="flex justify-center relative border-none items-center size-3 rounded-full bg-[--van-background-2] shadow-md pointer-events-auto opacity-70 transition-[transform,width,height] force:opacity-100 active:size-6">
            <div v-if="showSliderButtonNumber"
              class="slider-button-number w-6 absolute text-center p-[2px] z-[200000] bottom-[34px] rounded-lg text-white h-5 before:content-[''] bg-black before:bg-black before:absolute before:left-1/2 before:bottom-0 before:-translate-x-1/2 before:translate-y-1/2 before:rotate-45 before:w-2 before:h-2">
              {{ selectPage + 1 }}
            </div>
          </button>
        </template>
      </VanSlider>
      <VanRow class="w-full h-full">
        <VanCol span="1"></VanCol>
        <VanCol span="17" class="!h-full !flex items-center">
          <div @click="$emit('sendComment')"
            class="bg-white text-gray-400 pointer-events-auto bg-opacity-30 w-full h-[65%] rounded-full px-2 flex items-center !text-xs van-ellipsis">
            写下你的留言吧...
          </div>
        </VanCol>
        <VanCol span="3" class="!h-full !flex items-center justify-center pointer-events-auto"
          @click="toComicPage(`/comic/${comic._id}/info`)">
          <VanIcon name="info-o" size="calc(var(--footer-height)/2)" />
        </VanCol>
        <VanCol span="3" class="!h-full !flex items-center justify-center pointer-events-auto"
          @click="toComicPage(`/comic/${comic._id}/read/1#${index + 1}`)">
          <VanIcon name="enlarge" size="calc(var(--footer-height)/2)" />
        </VanCol>
      </VanRow>
    </div>
    <div
      class="absolute right-0 bottom-[--footer-height] w-[--aside-width] h-80 flex justify-end items-center flex-col *:pointer-events-auto *:flex *:flex-col *:items-center *:justify-center">
      <!-- aside -->
      <div @click="comicReactive?.like()">
        <VanIcon name="like" size="var(--aside-width)" color="var(--van-primary-color)" v-if="comicReactive.isLiked" />
        <VanIcon name="like" size="var(--aside-width)" v-else color="white" />
        <div>{{ comicReactive.likesCount }}</div>
      </div>
      <div class="pb-3" @click="comicReactive?.favourt()">
        <VanIcon name="star" size="var(--aside-width)" color="var(--van-primary-color)"
          v-if="comicReactive?.isFavourite" />
        <van-icon name="star" size="var(--aside-width)" v-else color="white" />
      </div>
      <div @click="$emit('comment')" class="mb-2">
        <VanIcon name="chat" size="var(--aside-width)" color="white" />
        <div class="h-4">{{ info ? info.totalComments : '' }}</div>
      </div>
    </div>
    <div class="absolute left-0 bottom-[--footer-height] w-[calc(100%-var(--aside-width))] px-3">
      <!-- left bar -->
      <NThing class="bg-transparent overflow-hidden relative w-[calc(100%-24px)]">
        <template #avatar v-if="info">
          <Image :src="info._creator.avatar" fit="cover"
            class="pointer-events-auto !w-[45px] !h-[45px] mt-1 border border-white border-solid" round previewable />
        </template>
        <template #header>
          <div class="pointer-events-auto mt-2 -mb-2 flex items-center text-sm text-[--p-color] font-black w-full">
            {{ authors[0] }}
            <span v-if="authors.length > 1">...</span>
            <VanButton type="primary" @click="authors.length > 1 ? $emit('sub', authors) : sb()"
              class="pointer-events-auto px-2 ml-2 !text-sm font-[400] !text-nowrap" icon="plus" size="mini" round>订阅
            </VanButton>
          </div>
          <div class="text-xs mt-3 -mb-1 text-white">{{ comic.totalViews }}观看</div>
        </template>
        <div class="text-sm font-black text-white pointer-events-auto van-multi-ellipsis--l2"
          @click="$props.info && $emit('info', $props.info)">
          {{ comic.title }}
          <div class="inline text-xs font-light text-nowrap">
            展开详情
            <VanIcon name="arrow-down" />
          </div>
        </div>
      </NThing>
    </div>
    <div class="absolute w-full h-5 bottom-[--footer-height]"
      style="background: linear-gradient(rgba(0,0,0,0),rgba(0,0,0,0.3));">
      <!-- effect -->
    </div>
  </div>

</template>
<style scoped lang='scss'>
:deep(.n-result-header__title) {
  color: white !important;
}

.slider-button-number::before {
  clip-path: polygon(100% 0%,
      100% 100%,
      100% 100%,
      0% 100%);
}
</style>