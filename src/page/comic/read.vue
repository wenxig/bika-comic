<script setup lang='tsx'>
import { getComicPages, Image as RawImageData } from '@/api'
import { computed, onMounted, onUnmounted, shallowRef, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { toNumber, clone, isEmpty, remove, isNumber } from 'lodash-es'
import { useAppStore } from '@/stores'
import { useTitle, reactiveComputed } from '@vueuse/core'
import { createLoadingMessage } from '@/utils/message'
import config from '@/config'
import ComicView from '@/components/comic/comicView.vue'
import { FavourtImage, patchWatchHitory, WatchHistory } from '@/api/plusPlan'
import { useComicStore } from '@/stores/comic'
import CommentVue from '@/components/comment/comment.vue'
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
  if (comicStore.comic.comic) return new WatchHistory([epId.toString(), comicStore.comic.comic, (comicView.value?.index ?? 0) - 1, new Date().getTime()])
  throw new Error('comic is not have value!!!')
}
const saveHistory = () => comicStore.comic.comic && patchWatchHitory({ [comicId]: createHistory() }).catch(() => window.$message.error('历史记录同步失败'))
watch(() => comicView.value?.index, page => {
  if (isNumber(page)) {
    if (comicStore.comic.comic) console.log('history: ', app.readHistory[comicId] = createHistory())
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

// 导航
const toNextEp = () => (epId + 1 <= _eps.length) ? (!isEmpty(images.value) && $router.force.replace(`/comic/${comicId}/read/${epId + 1}`)) : showInLast()
const toLastEp = () => epId - 1 > 0 ? (lastPagesLength.value && $router.force.replace(`/comic/${comicId}/read/${epId - 1}`)) : showInFirst()
</script>

<template>
  <ComicView :images :comic-title="comicStore.comic.comic ? comicStore.comic.comic.title : ''" :startPosition="page"
    :ep-title="epInfo?.title" ref="comicView" @back="$router.back()" v-if="!isEmpty(images)"
    @add-favourt-image="(src, time) => comic && app.favourtImages.push(new FavourtImage({ src, time, comic }))"
    @remove-favourt-image="src => remove(app.favourtImages, { src })" @last-ep="toLastEp" @next-ep="toNextEp">
    <template #menu="{ MenuButton }">
      <component :is="MenuButton" icon="list-switch" @click="epSelectShow = true">
        章节
      </component :is="MenuButton">
      <template v-if="comicStore.comic.comic">
        <component :is="MenuButton" baseIcon="like" :primary="comicStore.comic.comic.isLiked"
          @click="comicStore.comic.comic?.like()">
          点赞
        </component :is="MenuButton">
        <component :is="MenuButton" baseIcon="star" :primary="comicStore.comic.comic.isFavourite"
          @click="comicStore.comic.comic?.favourt()">
          点赞
        </component :is="MenuButton">
      </template>
      <component :is="MenuButton" icon="chat-o" @click="comment?.show()">
        评论
      </component :is="MenuButton">
    </template>
    <template #left="{ width, MenuButton }">
      <component :is="MenuButton" size="small" icon="notes-o" @click="showComicInfo = true" :width>
        关于
      </component>
      <component :is="MenuButton" size="small" icon="arrow-double-left" @click="toLastEp" :width>
        上一章
      </component>
    </template>
    <template #right="{ width, MenuButton }">
      <component :is="MenuButton" size="small" icon="list-switch" @click="showComicLike = true" :width>
        推荐
      </component>
      <component :is="MenuButton" size="small" icon="arrow-double-right" @click="toNextEp" :width>
        下一章
      </component>
    </template>
  </ComicView>

  <!-- 章节选择 -->
  <Popup v-model:show="epSelectShow" class="max-h-[70%] min-h-[30%] pt-5 overflow-hidden overflow-y-auto" round
    position="bottom" closeable>
    <Eps :eps="comicStore.comic.eps" :state="comicStore.comic.epsStateContent" :id="comicStore.comic.preload?._id ?? ''"
      :now="epId" mode="replace" />
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
    <Likes :likes="comicStore.comic.likeComic" mode="replace" :state="comicStore.comic.likeComicStateContent" />
  </Popup>
</template>