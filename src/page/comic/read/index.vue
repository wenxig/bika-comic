<script setup lang='ts'>
import { getComicPages, ProPlusMaxComic, Image as RawImageData } from '@/api'
import { computed, onMounted, onUnmounted, shallowRef, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { toNumber, clone } from 'lodash-es'
import { useAppStore } from '@/stores'
import { useTitle, reactiveComputed, until } from '@vueuse/core'
import { createLoadingMessage } from '@/utils/message'
import config from '@/config'
import ComicView from '@/components/comic/comicView.vue'
import { patchWatchHitory, WatchHistory } from '@/api/plusPlan'
import { useComicStore } from '@/stores/comic'
import CommentVue from '@/components/comment.vue'
import Eps from '../info/eps.vue'
import TopInfo from '../info/topInfo.vue'
import Uploader from '../info/uploader.vue'
import Likes from '../info/likes.vue'
import FloatPopup from '@/components/floatPopup.vue'
import Popup from '@/components/popup.vue'
const $route = useRoute()
const $router = useRouter()
const epId = toNumber($route.params.ep)
const comicId = $route.params.id as string
const app = useAppStore()
const comicStore = useComicStore()
const page = (toNumber($route.hash.substring(1)) || 1) - 1
const comic = computed(() => comicStore.comic.comic)
const comicView = shallowRef<InstanceType<typeof ComicView>>()

// 历史记录
const createHistory = () => {
  if (comicStore.comic.comic) return new WatchHistory([epId.toString(), comicStore.comic.comic, Number($route.hash.substring(1)) - 1, new Date().getTime()])
  throw new Error('comic is not have value!!!')
}
const saveHistory = () => comicStore.comic.comic && patchWatchHitory({ [comicId]: createHistory() }).catch(() => window.$message.error('历史记录同步失败'))
watch(() => comicView.value?.index, page => {
  if (page || page == 0) {
    if (comicStore.comic.comic) app.readHistory[comicId] = createHistory()
    $router.force.replace($route.fullPath.includes('#') ? $route.fullPath.replace(/#.+/g, `#${page + 1}`) : `${$route.fullPath}#${page + 1}`)
  }
}, { immediate: true })
onBeforeRouteLeave((t, f) => { if (t.fullPath != f.fullPath) saveHistory() })
onMounted(async () => {
  await until(() => app.readHistory).not.toBeNull()
  saveHistory()
})

//标题
const eps = reactiveComputed(() => comicStore.comic.eps)
const epInfo = computed(() => eps[eps.length - epId])
const title = computed(() => `p${(comicView.value?.index ?? 0) + 1} | ${epInfo.value?.title ?? '阅读'} | ${(comic.value && comic.value?.title) || '漫画'} | bika`)
useTitle(title)

// 图源
const rawImages = shallowRef<RawImageData[]>([])
const images = shallowRef<string[]>([])
const lastPagesLength = shallowRef<number>();
(async () => {
  const loading = createLoadingMessage()
  onUnmounted(loading.destroy)
  const [v, v2] = await Promise.all([
    getComicPages(comicId, epId),
    (epId - 1 == 0) ? undefined : getComicPages(comicId, epId - 1)
  ])
  rawImages.value = v.map(v => v.media)
  images.value = v.map(v => v.media.getUrl())
  if (!v2) return loading
  lastPagesLength.value = v2.map(v => v.media).length
  return loading
})()
  .then(loading => loading.success())
  .catch(loading => loading.fail())


//选集
const epSelectShow = shallowRef(false)
const _eps = reactiveComputed(() => config.value['bika.info.unsortComic'] ? clone(comicStore.comic.eps).reverse() : comicStore.comic.eps)


// 评论
const comment = shallowRef<InstanceType<typeof FloatPopup>>()


// 关于
const showComicInfo = shallowRef(false)

// 推荐
const showComicLike = shallowRef(false)
</script>

<template>
  <ComicView :images show :comic-title="comicStore.comic.comic ? comicStore.comic.comic.title : ''"
    :startPosition="page" :ep-title="epInfo?.title" @back="$router.back()" ref="comicView"
    @last-ep="(epId - 1 > 0 && lastPagesLength) && $router.force.replace(`/comic/${comicId}/read/${epId - 1}#${lastPagesLength}`)"
    @next-ep="(epId + 1 <= _eps.length) && $router.force.replace(`/comic/${comicId}/read/${epId + 1}`)">
    <template #menu>
      <div @click="epSelectShow = true">
        <van-icon name="list-switch" size="2rem" class="-mb-1" />
        章节
      </div>
      <template v-if="comicStore.comic.comic">
        <div @click="comicStore.comic.comic?.like()">
          <van-icon name="like" size="2rem" class="-mb-1" color="var(--van-primary-color)"
            v-if="comicStore.comic.comic && comicStore.comic.comic.isLiked" />
          <van-icon name="like-o" size="2rem" class="-mb-1" v-else />
          点赞
        </div>
        <div @click="comicStore.comic.comic?.favourt()">
          <van-icon name="star" size="2rem" class="-mb-1" color="var(--van-primary-color)"
            v-if="comicStore.comic.comic && comicStore.comic.comic.isFavourite" />
          <van-icon name="star-o" size="2rem" class="-mb-1" v-else />
          收藏
        </div>
      </template>
      <div>
        <van-icon name="chat-o" size="2rem" class="-mb-1" @click="comment?.show()" />
        评论
      </div>
    </template>
    <template #left="{ width }">
      <div class="w-full flex justify-center items-center flex-col *:block" :style="{ height: width }"
        @click="showComicInfo = true">
        <VanIcon size="1rem" name="notes-o" />
        <span>关于</span>
      </div>
    </template>
    <template #right="{ width }">
      <div class="w-full flex justify-center items-center flex-col *:block" :style="{ height: width }"
        @click="showComicLike = true">
        <van-icon size="1rem" name="list-switch" />
        <span>推荐</span>
      </div>
    </template>
  </ComicView>

  <!-- 章节选择 -->
  <Popup v-model:show="epSelectShow" class="h-[70%]" round position="bottom">
    <Eps :eps="comicStore.comic.eps" :id="comicStore.comic.preload._id" :now="epId" v-if="!!comicStore.comic.preload"
      mode="replace" />
  </Popup>

  <!-- 评论 -->
  <FloatPopup ref="comment" v-slot="{ height }">
    <CommentVue :id="comicId" :height />
  </FloatPopup>

  <!-- 关于 -->
  <Popup v-model:show="showComicInfo" position="left" round v-if="comic"
    class="w-[90vw] max-h-[70vh] pb-2 overflow-x-hidden overflow-y-auto">
    <TopInfo :comic mode="replace" />
    <Uploader :comic mode="replace" />
  </Popup>

  <!-- 推荐 -->
  <Popup v-model:show="showComicLike" position="right" round
    class="w-[90vw] max-h-[70vh] pb-2 overflow-x-hidden overflow-y-auto">
    <Likes :likes="comicStore.comic.likeComic" mode="replace" />
  </Popup>
</template>