<script setup lang='ts'>
import { getComicPages, Image as RawImageData } from '@/api'
import { computed, onMounted, onUnmounted, shallowRef, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { toNumber, clone, isEmpty, remove } from 'lodash-es'
import { useAppStore } from '@/stores'
import { useTitle, reactiveComputed } from '@vueuse/core'
import { createLoadingMessage } from '@/utils/message'
import config from '@/config'
import ComicView from '@/components/comic/comicView.vue'
import { FavourtImage, patchWatchHitory, WatchHistory } from '@/api/plusPlan'
import { useComicStore } from '@/stores/comic'
import CommentVue from '@/components/comic/comment/comment.vue'
import Eps from '@/components/comic/info/eps.vue'
import TopInfo from '@/components/comic/info/topInfo.vue'
import Uploader from '@/components/comic/info/uploader.vue'
import Likes from '@/components/comic/info/likes.vue'
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
  try {
    if (eps[epId + 1]) getComicPages(comicId, epId + 1)  // 下一
    const [v, v2] = await Promise.all([
      getComicPages(comicId, epId), // 当前
      (epId - 1 == 0) ? undefined : getComicPages(comicId, epId - 1), // 上一
    ])
    console.log(v.map(v => v.media))

    rawImages.value = v.map(v => v.media)
    images.value = v.map(v => v.media.getUrl())
    if (!v2) return loading
    lastPagesLength.value = v2.map(v => v.media).length
    return loading
  } catch (error) {
    console.error(error)
    throw loading
  }
})()
  .then(loading => loading.success())
  .catch(loading => loading.fail())


//选集
const epSelectShow = shallowRef(false)
const _eps = reactiveComputed(() => config.value['bika.info.unsortComic'] ? clone(comicStore.comic.eps).reverse() : comicStore.comic.eps)
const showInLast = () => window.$message.info('已是最后的章节')
const showInFirst = () => window.$message.info('已是第一个章节')
// 评论
const comment = shallowRef<InstanceType<typeof FloatPopup>>()

// 关于
const showComicInfo = shallowRef(false)

// 推荐
const showComicLike = shallowRef(false)
</script>

<template>
  <ComicView :images show :comic-title="comicStore.comic.comic ? comicStore.comic.comic.title : ''"
    :startPosition="page" :ep-title="epInfo?.title" ref="comicView" @back="$router.back()"
    @add-favourt-image="(src, time) => comic && app.favourtImages.value.push(new FavourtImage({ src, time, comic }))"
    @remove-favourt-image="src => remove(app.favourtImages.value, { src })"
    @last-ep="epId - 1 > 0 ? (lastPagesLength && $router.force.replace(`/comic/${comicId}/read/${epId - 1}#${lastPagesLength}`)) : showInFirst()"
    @next-ep="(epId + 1 <= _eps.length) ? (!isEmpty(images) && $router.force.replace(`/comic/${comicId}/read/${epId + 1}`)) : showInLast()">
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
  <Popup v-model:show="epSelectShow" class="max-h-[70%] min-h-[30%] pt-5 overflow-hidden overflow-y-auto" round
    position="bottom" closeable>
    <Eps :eps="comicStore.comic.eps" :id="comicStore.comic.preload?._id ?? ''" :now="epId" mode="replace" />
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