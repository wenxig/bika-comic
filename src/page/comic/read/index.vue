<script setup lang='ts'>
import { favouriteComic, getComicPages, likeComic, Image as RawImageData } from '@/api'
import { computed, onMounted, onUnmounted, shallowRef, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { toNumber, clone, remove, isBoolean, noop } from 'lodash-es'
import { useAppStore } from '@/stores'
import { useTitle, reactiveComputed, until } from '@vueuse/core'
import { createLoadingMessage } from '@/utils/message'
import config, { fullscreen } from '@/config'
import ComicView from '@/components/comic/comicView.vue'
import { patchWatchHitory, WatchHistory, FavourtImage } from '@/api/plusPlan'
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
const eps = reactiveComputed(() => comicStore.comic.eps)
const epInfo = computed(() => eps[eps.length - epId])
const comic = computed(() => comicStore.comic.comic)
const comicView = shallowRef<InstanceType<typeof ComicView>>()
watch(() => comicView.value?.index, page => {
  if (page || page == 0) {
    if (comicStore.comic.comic) app.readHistory[comicId] = new WatchHistory([epId.toString(), comicStore.comic.comic, page, new Date().getTime()])
    $router.force.replace($route.fullPath.includes('#') ? $route.fullPath.replace(/#.+/g, `#${page + 1}`) : `${$route.fullPath}#${page + 1}`)
  }
}, { immediate: true })
const saveHistory = () => comicStore.comic.comic && patchWatchHitory({ [comicId]: new WatchHistory([epId.toString(), comicStore.comic.comic, page, new Date().getTime()]) }).then(newData => {
  if (isBoolean(newData)) {
    window.$message.error('历史记录同步失败')
    return
  }
  console.log('new history:', newData)
  app.$patch({
    readHistory: newData
  })
}).catch(noop)
onBeforeRouteLeave((t, f) => { if (t.fullPath != f.fullPath) saveHistory() })
onMounted(async () => {
  await until(() => app.readHistory).not.toBeNull()
  saveHistory()
})
const title = computed(() => `p${comicView.value?.index} | ${epInfo.value?.title ?? '阅读'} | ${(comic.value && comic.value?.title) || '漫画'} | bika`)
useTitle(title)
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

// 控制面板
const handleLike = async () => {
  const loading = createLoadingMessage()
  await likeComic(comicId)
  if (comicStore.comic.comic) comicStore.comic.comic!.isLiked = !comicStore.comic.comic!.isLiked
  loading.success()
}
const handleFavourite = async () => {
  const loading = createLoadingMessage()
  await favouriteComic(comicId)
  if (comicStore.comic.comic) comicStore.comic.comic!.isFavourite = !comicStore.comic.comic!.isFavourite
  app.user = undefined
  loading.success()
}
//选集
const epSelect = shallowRef<InstanceType<typeof FloatPopup>>()
const _eps = reactiveComputed(() => config.value.unsortComic ? clone(comicStore.comic.eps).reverse() : comicStore.comic.eps)


// 评论
const commentHeight = shallowRef(0)
const comment = shallowRef<InstanceType<typeof FloatPopup>>()

// 设置
const setting = shallowRef<InstanceType<typeof FloatPopup>>()

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
      <div @click="epSelect?.show()">
        <van-icon name="list-switch" size="2rem" class="-mb-1" />
        章节
      </div>
      <div @click="handleLike">
        <van-icon name="like" size="2rem" class="-mb-1" color="var(--van-primary-color)"
          v-if="comicStore.comic.comic && comicStore.comic.comic.isLiked" />
        <van-icon name="like-o" size="2rem" class="-mb-1" v-else />
        点赞
      </div>
      <div @click="handleFavourite">
        <van-icon name="star" size="2rem" class="-mb-1" color="var(--van-primary-color)"
          v-if="comicStore.comic.comic && comicStore.comic.comic.isFavourite" />
        <van-icon name="star-o" size="2rem" class="-mb-1" v-else />
        收藏
      </div>
      <div>
        <van-icon name="chat-o" size="2rem" class="-mb-1" @click="comment?.show()" />
        评论
      </div>
      <div @click="setting?.show(1)">
        <van-icon name="more-o" size="2rem" class="-mb-1" />
        更多
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
  <FloatPopup ref="epSelect">
    <Eps :eps="comicStore.comic.eps" :id="comicStore.comic.preload._id" :now="epId" v-if="!!comicStore.comic.preload"
      mode="replace" />
  </FloatPopup>

  <!-- 评论 -->
  <FloatPopup ref="comment" v-model:height="commentHeight">
    <CommentVue :id="comicId" v-if="comment?.isShowing" v-model:height="commentHeight" />
  </FloatPopup>

  <!-- 设置 -->
  <FloatPopup ref="setting">
    <van-cell-group>
      <div class="van-cell van-haptics-feedback" @click="() => {
        app.favourtImages.value.find(v => v.src == images[comicView?.index ?? 0])
          ? remove(app.favourtImages.value, v => v.src == images[comicView?.index ?? 0])
          : app.favourtImages.value.push(new FavourtImage({ src: images[comicView?.index ?? 0], time: Date.now() }))
      }">
        <van-icon :name="app.favourtImages.value.find(v => v.src == images[comicView?.index ?? 0]) ? 'minus' : 'plus'"
          class="van-cell__left-icon" />
        {{ app.favourtImages.value.find(v => v.src == images[comicView?.index ?? 0]) ? '从图片收藏移除' : '添加至图片收藏' }}
      </div>
      <VanCell title="全屏" icon="enlarge" clickable @click="fullscreen.enter()"></VanCell>
    </van-cell-group>
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