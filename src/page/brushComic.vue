<script setup lang='ts'>
import { Swiper, SwiperSlide } from 'swiper/vue'
import 'swiper/css'
import 'swiper/css/virtual'
import type { Swiper as SwiperClass } from 'swiper/types/index.d.ts'
import { Virtual, Pagination, Keyboard } from 'swiper/modules'
import 'swiper/css/pagination'
import { computed, nextTick, reactive, shallowRef, watch } from 'vue'
import { brushComic, preloadEps, preloadLikes, preloadPages, preloaInfo, random } from '@/stores/temp'
import { getComicEps, getComicInfo, getRecommendComics, getComicPages, ProPlusMaxComic, RandomComicStream } from '@/api'
import BrushView from '@/components/comic/brush/brushView.vue'
import { createLoadingMessage, type LoadingInstance } from '@/utils/message'
import CommentVue from '@/components/comment/comment.vue'
import FloatPopup from '@/components/floatPopup.vue'
import Await from '@/components/await.vue'
import { onBeforeRouteLeave } from 'vue-router'
import { createStateContentData } from '@/utils/requset'
document.title = '刷漫画 | bika'
const swEl = shallowRef<InstanceType<typeof Swiper>>()
const swiper = computed<SwiperClass | undefined>(() => swEl.value?.$el?.swiper)
const index = computed(() => swiper.value?.realIndex || 0)
const stream = random.stream ??= new RandomComicStream()
stream.next()
let loading = {} as Partial<LoadingInstance>

let noDataLoadingStoper: VoidFunction | void
const stopNoDataWatcher = watch(stream.docs, docs => {
  if (docs.length == 0 && !noDataLoadingStoper) noDataLoadingStoper = createLoadingMessage().success
  else {
    noDataLoadingStoper?.()
    try {
      stopNoDataWatcher()
    } catch { }
  }
}, { immediate: true })

watch(index, index => {
  // preload comics data
  if (!stream.isRequesting.value && stream.docs.value.length - index < 3) { stream.next() }

  // scroll to bottom but new data not ready
  if (stream.isRequesting.value && stream.docs.value.length - index == 1) {
    if (!loading) loading = createLoadingMessage()
  }
})

watch(stream.isRequesting, isRequesting => {
  if (!isRequesting) {
    if (stream.isErr.value) loading.fail?.()
    else loading.success?.()
  }
})

watch(() => [index.value, stream.docs.value] as const, ([index, docs]) => {
  for (const comic of docs.slice(index, index + 3)) {
    if (!preloadEps.has(comic._id)) preloadEps.set(comic._id, getComicEps(comic._id))
    if (!preloadPages.has(comic._id)) preloadPages.set(comic._id, getComicPages(comic._id, 1))
    if (!preloaInfo.has(comic._id)) preloaInfo.set(comic._id, getComicInfo(comic._id))
    if (!preloadLikes.has(comic._id)) preloadLikes.set(comic._id, getRecommendComics(comic._id))
  }
})

const activeComic = computed(() => stream.docs.value[index.value])
const comment = shallowRef<InstanceType<typeof FloatPopup>>()
const commentContent = shallowRef<InstanceType<typeof CommentVue>>()
const sendCommnetShow = async () => {
  comment.value?.show()
  await nextTick()
  commentContent.value?.forceInput()
}

const isShowComicInfo = shallowRef(false)
const comicInfo = shallowRef<[Promise<any> | ProPlusMaxComic | false, id: string]>()
const showComicInfo = (info: Promise<ProPlusMaxComic | false>) => {
  const oldId = activeComic.value._id
  comicInfo.value = [info, oldId]
  isShowComicInfo.value = true
  info.then((info) => {
    if (oldId == activeComic.value._id) {
      comicInfo.value = [info, oldId]
    }
  })
}


const initialSlide = brushComic.comicIndex
const onInit = async () => {
  setTimeout(async () => {
    do {
      swiper.value?.slideTo(initialSlide, 0)
      console.log('init page index', initialSlide)
    } while (index.value != initialSlide)
  }, 0)
}
onBeforeRouteLeave(() => void (brushComic.comicIndex = index.value))

const isShowSubAn = shallowRef(false)
const ans = shallowRef<string[]>()
const showSubAnBar = (an: string[]) => {
  isShowSubAn.value = true
  ans.value = an
}
const instanceOfView = reactive<Record<string, InstanceType<typeof BrushView>>>({})

const showMenu = shallowRef(true)
watch(() => [showMenu.value, instanceOfView[activeComic.value?._id ?? '']?.isScale] as const, ([showMenu, isScale]) => {
  console.log('can enable swiper', showMenu && !isScale)

  if (showMenu && !isScale) swiper.value?.enable()
  else swiper.value?.disable()
})

const isSliding = shallowRef(false)
const onSlideChangeStart = () => isSliding.value = true
const onSlideChangeEnd = () => isSliding.value = false

window.$api.swiper = swiper
</script>

<template>
  <Swiper :modules="[Virtual, Pagination, Keyboard]" :initialSlide @init="onInit" ref="swEl"
    class="w-full h-full bg-black relative" virtual direction="vertical" keyboard
    @slideChangeTransitionStart="onSlideChangeStart" @slideChangeTransitionEnd="onSlideChangeEnd">
    <SwiperSlide v-for="(comic, index) of stream.docs.value" :key="index" :virtualIndex="index" :data-hash="index + 1"
      class="overflow-hidden w-full h-full" :data-history="comic._id">
      <BrushView :id="comic._id" :comic :eps="preloadEps.get(comic._id)" :firstPages="preloadPages.get(comic._id)"
        @sub="showSubAnBar" @comment="comment?.show()" :info="preloaInfo.get(comic._id)" @send-comment="sendCommnetShow"
        :showMenu @info="showComicInfo" :ref="(comp: any) => instanceOfView[comic._id] = comp"
        @dbclick="activeComic.like()" @click="isSliding || swiper?.animating || (showMenu = !showMenu)" />
    </SwiperSlide>
    <div class="absolute top-0 left-0 w-full h-10 z-[2] pointer-events-none flex items-center text-white">
      <VanIcon name="arrow-left" size="1.5rem" color="white" class="ml-2 pointer-events-auto" @click="$router.back()" />
    </div>
  </Swiper>

  <!-- 评论 -->
  <FloatPopup ref="comment" v-slot="{ height }">
    <CommentVue :id="activeComic._id" :height ref="commentContent" />
  </FloatPopup>

  <!-- 关于 -->
  <Popup v-model:show="isShowComicInfo" position="bottom" round @closed="comicInfo = undefined"
    class="w-full h-[60vh] pb-2 overflow-x-hidden overflow-y-auto">
    <template v-if="comicInfo">
      <VanTabs v-if="(comicInfo[0] instanceof ProPlusMaxComic)" animated>
        <VanTab title="简介">
          <TopInfo :comic="comicInfo[0]" />
          <Uploader :comic=comicInfo[0] />
        </VanTab>
        <VanTab title="推荐">
          <Await :promise="preloadLikes.get(comicInfo[1])!" v-slot="{ result }">
            <Likes :likes="result" />
          </Await>
        </VanTab>
        <VanTab title="选集">
          <Await :promise="preloadEps.get(comicInfo[1])!" v-slot="{ result }">
            <Eps :eps="createStateContentData(result)" :id="comicInfo[1]" v-if="result" />
            <div class="w-full flex justify-center items-center" v-else>
              <van-loading size="24px">加载中...</van-loading>
            </div>
          </Await>
        </VanTab>
      </VanTabs>
      <NResult status="error" title="错误" description="审核中" v-else-if="comicInfo[0] == false"
        class="!w-full !h-full bg-black !text-white !flex !flex-col !items-center !justify-center" />
      <div class="w-full flex justify-center items-center" v-else>
        <van-loading size="24px">加载中...</van-loading>
      </div>
    </template>
  </Popup>
  <Popup v-model:show="isShowSubAn" @closed="ans = undefined">
    <template v-if="ans">
      <VanCell v-for="an of ans" :title="an" icon="search-o" is-link
        :url="`/search?mode=author&keyword=${encodeURIComponent(an)}`" />
    </template>
    <div class="w-full flex justify-center items-center" v-else>
      <van-loading size="24px">加载中...</van-loading>
    </div>
  </Popup>
</template>