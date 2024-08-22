<script setup lang='ts'>
import { Swiper, SwiperSlide } from 'swiper/vue'
import 'swiper/css'
import 'swiper/css/virtual'
import type { Swiper as SwiperClass } from 'swiper/types/index.d.ts'
import { Virtual, Pagination, Keyboard } from 'swiper/modules'
import 'swiper/css/pagination'
import { computed, nextTick, onMounted, reactive, shallowRef, watch } from 'vue'
import { brushComic, random } from '@/stores/temp'
import { Ep, getComicEps, getComicInfo, getComicLikeOthers, getComicPages, Page, ProComic, ProPlusMaxComic, RandomComicStream } from '@/api'
import BrushView from '@/components/comic/brush/brushView.vue'
import { createLoadingMessage, type LoadingInstance } from '@/utils/message'
import CommentVue from '@/components/comment/comment.vue'
import FloatPopup from '@/components/floatPopup.vue'
import { findLastIndex, isEmpty } from 'lodash-es'
import Await from '@/components/await.vue'
const swiper = shallowRef<SwiperClass>()
const stream = random.stream ??= new RandomComicStream()
stream.next()
const index = shallowRef(0)
let loading = {} as Partial<LoadingInstance>
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

const preloadEps = reactive(new Map<string, Promise<Ep[]>>())
const preloadPages = reactive(new Map<string, Promise<Page[]>>())
const preloaInfo = reactive(new Map<string, Promise<ProPlusMaxComic | false>>())
const preloadLikes = reactive(new Map<string, Promise<ProComic[]>>())
watch(() => [index.value, stream.docs.value] as const, ([index, docs]) => {
  for (const comic of docs.slice(index, index + 3)) {
    if (!preloadEps.has(comic._id)) preloadEps.set(comic._id, getComicEps(comic._id))
    if (!preloadPages.has(comic._id)) preloadPages.set(comic._id, getComicPages(comic._id, 1))
    if (!preloaInfo.has(comic._id)) preloaInfo.set(comic._id, getComicInfo(comic._id))
    if (!preloadLikes.has(comic._id)) preloadLikes.set(comic._id, getComicLikeOthers(comic._id))
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


onMounted(() => {
  if (isEmpty(brushComic.comicID)) return
  const index = findLastIndex(random.stream?.docs.value ?? [], { _id: brushComic.comicID })
  if (!index) return
  const to = () => swiper.value?.slideTo(index - 1, 0)
  if (!to()) var iv = setInterval(() => to() && clearInterval(iv), 100)
})

const isShowSubAn = shallowRef(false)
const ans = shallowRef<string[]>()
const showSubAnBar = (an: string[]) => {
  isShowSubAn.value = true
  ans.value = an
}


</script>

<template>
  <!-- need pull reloader -->
  <Swiper :modules="[Virtual, Pagination, Keyboard]" @swiper="sw => swiper = sw"
    @slideChange="sw => index = sw.realIndex" class="w-full h-full bg-black relative" virtual direction="vertical"
    keyboard>
    <SwiperSlide v-for="(comic, index) of stream.docs.value" :key="index" :virtualIndex="index" :data-hash="index + 1"
      class="overflow-hidden w-full h-full" :data-history="comic._id">
      <BrushView :comic :eps="preloadEps.get(comic._id)" :firstPages="preloadPages.get(comic._id)" @sub="showSubAnBar"
        @comment="comment?.show()" :info="preloaInfo.get(comic._id)" @send-comment="sendCommnetShow"
        @info="showComicInfo" />
    </SwiperSlide>
    <div class="absolute top-0 left-0 w-full h-10 z-[2] pointer-events-none flex items-center">
      <VanIcon name="arrow-left" size="1.5rem" color="white" class="ml-2 pointer-events-auto" @click="$router.back()" />
    </div>
  </Swiper>

  <!-- 评论 -->
  <FloatPopup ref="comment" v-slot="{ height }">
    <CommentVue :id="activeComic._id" :height ref="commentContent" />
  </FloatPopup>

  <!-- 关于 -->
  <Popup v-model:show="isShowComicInfo" position="bottom" round @closed="comicInfo = undefined"
    class="w-full max-h-[70vh] pb-2 overflow-x-hidden overflow-y-auto">
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
            <Eps :eps="result" :id="comicInfo[1]" v-if="result" />
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