<script setup lang='ts'>
import { getComicPages, Image as RawImageData } from '@/api'
import { computed, onMounted, onUnmounted, shallowRef, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { toNumber, isEmpty, remove, isNumber } from 'lodash-es'
import { useAppStore } from '@/stores'
import { useTitle } from '@vueuse/core'
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
const pageIns = computed(() => comicStore.now)
const comicStore = useComicStore()
const page = (toNumber($route.hash.substring(1)) || 1) - 1
const detail = computed(() => pageIns.value?.detail.value)
const union = computed(() => pageIns.value?.union.value)
const eps = computed(() => pageIns.value?.eps.value)
const recommend = computed(() => pageIns.value?.recommendComics.value)
const comicView = shallowRef<InstanceType<typeof ComicView>>()

// 历史记录
const createHistory = () => {
  if (detail.value) return new WatchHistory([epId.toString(), detail.value, (comicView.value?.index ?? 0) - 1, new Date().getTime()])
  throw new Error('comic is not have value!!!')
}
const saveHistory = () => detail.value && patchWatchHitory({ [comicId]: createHistory() }).catch(() => window.$message.error('历史记录同步失败'))
watch(() => comicView.value?.index, page => {
  if (isNumber(page) && detail.value) {
    app.readHistory[comicId] = createHistory()
    console.log('history:', app.readHistory[comicId])
  }
}, { immediate: true })
onBeforeRouteLeave((t, f) => { if (t.fullPath != f.fullPath) saveHistory() })
onMounted(async () => {
  saveHistory()
})

//标题
const epInfo = computed(() => eps.value && eps.value[eps.value.length - epId])
const title = computed(() => `p${((comicView.value?.index ?? 0) + 1) || 1} | ${epInfo.value?.title || '阅读'} | ${union.value?.title || '漫画::加载中'} | bika`)
useTitle(title)

// 图源
const rawImages = shallowRef<RawImageData[]>([])
const images = shallowRef<string[]>([])
const lastPagesLength = shallowRef<number>();
(async () => {
  const loading = createLoadingMessage()
  onUnmounted(loading.destroy)
  try {
    if (eps.value?.[epId + 1]) getComicPages(comicId, epId + 1)  // 下一
    const [v, v2] = await Promise.all([
      getComicPages(comicId, epId), // 当前
      (epId - 1 == 0) ? undefined : getComicPages(comicId, epId - 1), // 上一
    ])

    rawImages.value = v.map(v => v.media)
    images.value = v.map(v => v.media.getUrl())

    console.log('image list:', rawImages.value, 'image url list:', images.value)
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
const epsInUnsortRule = computed(() => config.value['bika.info.unsortComic'] ? eps.value?.toReversed() : eps.value)
const showInLast = () => window.$message.info('已是最后的章节')
const showInFirst = () => window.$message.info('已是第一个章节')
// 评论
const comment = shallowRef<InstanceType<typeof FloatPopup>>()

// 关于
const showComicInfo = shallowRef(false)

// 推荐
const showComicLike = shallowRef(false)

// 导航
const toNextEp = () => (epId + 1 <= (epsInUnsortRule.value?.length ?? 1)) ? (!isEmpty(images.value) && $router.force.replace(`/comic/${comicId}/read/${epId + 1}`)) : showInLast()
const toLastEp = () => epId - 1 > 0 ? (lastPagesLength.value && $router.force.replace(`/comic/${comicId}/read/${epId - 1}`)) : showInFirst()
</script>

<template>
  <ComicView :images :comic-title="union?.title || ''" :startPosition="page" :ep-title="epInfo?.title" ref="comicView"
    @back="$router.back()" v-if="!isEmpty(images)"
    @add-favourt-image="(src, time) => detail && app.favourtImages.push(new FavourtImage({ src, time, comic: detail }))"
    @remove-favourt-image="src => remove(app.favourtImages, { src })" @last-ep="toLastEp" @next-ep="toNextEp">
    <template #menu="{ MenuButton }">
      <component :is="MenuButton" withBg icon="list-switch" @click="epSelectShow = true">
        章节
      </component>
      <template v-if="union">
        <component :is="MenuButton" withBg baseIcon="like" :primary="union?.isLiked" @click="union?.like()">
          点赞
        </component>
        <component :is="MenuButton" withBg baseIcon="star" :primary="union?.isFavourite" @click="union?.favourt()">
          收藏
        </component>
      </template>
      <component :is="MenuButton" withBg icon="chat-o" v-if="detail?.allowComment" @click="comment?.show()">
        评论
      </component>
    </template>

    <template #left="{ width, MenuButton }">
      <component :is="MenuButton" withBg class="rounded-tr-lg bg-black" size="small" icon="notes-o"
        @click="showComicInfo = true" :width>
        关于
      </component>
      <component :is="MenuButton" withBg class="rounded-br-lg bg-black" size="small" icon="arrow-double-left"
        @click="toLastEp" :width>
        上一章
      </component>
    </template>

    <template #right="{ width, MenuButton }">
      <component :is="MenuButton" class="rounded-tl-lg bg-black" size="small" icon="list-switch"
        @click="showComicLike = true" :width>
        推荐
      </component>
      <component :is="MenuButton" class="rounded-bl-lg bg-black" size="small" icon="arrow-double-right"
        @click="toNextEp" :width>
        下一章
      </component>
    </template>

  </ComicView>

  <!-- 章节选择 -->
  <Popup v-model:show="epSelectShow" class="max-h-[70%] min-h-[30%] pt-5 overflow-hidden overflow-y-auto" round
    position="bottom" closeable>
    <Eps :eps="pageIns?.epsStateContent.value" :id="pageIns?.comicId ?? ''" :now="epId" mode="replace" />
  </Popup>

  <!-- 评论 -->
  <FloatPopup ref="comment" v-slot="{ height }">
    <CommentVue :id="comicId" :height />
  </FloatPopup>

  <!-- 关于 -->
  <Popup v-model:show="showComicInfo" position="left" round
    class="w-[90vw] max-h-[70vh] pb-2 overflow-x-hidden overflow-y-auto">
    <TopInfo :comic="union" mode="replace" />
    <Uploader :comic="detail" mode="replace" v-if="detail" />
  </Popup>

  <!-- 推荐 -->
  <Popup v-model:show="showComicLike" position="right" round
    class="w-[90vw] max-h-[70vh] pb-2 overflow-x-hidden overflow-y-auto">
    <Likes :likes="recommend" mode="replace" :state="pageIns?.recommendComicStateContent.value" />
  </Popup>
</template>