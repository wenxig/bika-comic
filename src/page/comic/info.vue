<script setup lang='ts'>
import { useAppStore } from '@/stores'
import { computed, shallowRef, watch } from 'vue'
import { isEmpty, last, toNumber } from 'lodash-es'
import Likes from '@/components/comic/info/likes.vue'
import { getComicPages } from '@/api'
import { useTitle, reactiveComputed } from '@vueuse/core'
import { useComicStore } from '@/stores/comic'
import Eps from '@/components/comic/info/eps.vue'
import TopInfo from '@/components/comic/info/topInfo.vue'
import Uploader from '@/components/comic/info/uploader.vue'
import { onBeforeRouteLeave } from 'vue-router'
const app = useAppStore()
const comicStore = useComicStore()
const pageIns = computed(() => comicStore.now)
const detail = computed(() => pageIns.value?.detail.value)
const preload = computed(() => pageIns.value?.preload.value)
const union = computed(() => pageIns.value?.union.value)
const eps = computed(() => pageIns.value?.eps.value)
const recommend = computed(() => pageIns.value?.recommendComics.value)
const history = reactiveComputed(() => pageIns.value?.comicId ? (app.readHistory[pageIns.value?.comicId] ?? []) : [])
const readButtonText = computed(() => (isEmpty(history) || !eps.value) ? '开始阅读' : `继续阅读: ${(eps.value[eps.value.length - toNumber(history[0])]?.title) ?? '漫画::加载中'}(P${(history[2] + 1) || 1})`)

const title = computed(() => ` ${preload.value?.title ?? '漫画'} | bika`)
useTitle(title)

// preload
const preloadIds = new Set<number>()
const stopPreloadWatch = watch(eps, eps => {
  if (!eps || !pageIns.value?.comicId) return
  const firstIndex = eps[0].order
  const lastIndex = last(eps)!.order
  const historyIndex = Number(history[0])
  
  console.log('perload comic pages index list:', firstIndex, lastIndex, historyIndex)

  preloadIds.add(firstIndex) // 首个
  preloadIds.add(lastIndex) // 最后一个
  preloadIds.add(historyIndex) // 历史记录
  for (const id of preloadIds.values()) if (!isNaN(id) && pageIns.value?.comicId) getComicPages(pageIns.value.comicId, id)
}, { immediate: true })
onBeforeRouteLeave(stopPreloadWatch)

//reload
const isReloadingAll = shallowRef(false)
const reloadAll = async () => {
  isReloadingAll.value = true
  await pageIns.value?.reloadAll()
  isReloadingAll.value = false
}
</script>

<template>
  <VanPullRefresh @refresh="reloadAll()" v-model="isReloadingAll">
      <template v-if="pageIns?.vailed.value != false">
        <TopInfo :comic="union" />
        <VanRow>
          <VanCol span="12">
            <VanButton class="w-full van-multi-ellipsis--l2" type="primary" round
              :disabled="pageIns?.epsStateContent.value.isEmpty"
              @click="!isEmpty(preload) && $router.force.push(isEmpty(history) ? `/comic/${preload?._id}/read/1` : `/comic/${pageIns?.comicId}/read/${history[0]}#${history[2] + 1}`)">
              {{ readButtonText }}
            </VanButton>
          </VanCol>
          <VanCol span="4" class="justify-center !flex items-center">
            <van-badge :content="union?.likesCount">
              <van-icon name="like" size="30px" color="var(--van-primary-color)" v-if="union?.isLiked"
                @click="union?.like()" />
              <van-icon name="like-o" size="30px" v-else color="var(--van-text-color)" @click="union?.like()" />
            </van-badge>
          </VanCol>
          <VanCol span="4" class="justify-center !flex items-center">
            <van-icon name="star" size="30px" color="var(--van-primary-color)" v-if="union?.isFavourite"
              @click="union?.favourt()" />
            <van-icon name="star-o" size="30px" v-else color="var(--van-text-color)" @click="union?.favourt()" />
          </VanCol>
          <VanCol span="4" class="justify-center !flex items-center"
            @click="detail?.allowComment && $router.force.push(`/comic/${preload?._id}/comments`)">
            <van-badge v-if="detail?.allowComment" :content="detail.commentsCount">
              <van-icon name="chat-o" size="30px" color="var(--van-text-color)" />
            </van-badge>
            <van-icon name="chat-o" size="30px" color="var(--van-text-color-2)" v-else />
          </VanCol>
        </VanRow>
        <Uploader :comic="detail" />
        <Eps :id="pageIns?.comicId ?? ''" :eps="pageIns?.epsStateContent.value" />
        <Likes :likes="recommend" :state="pageIns?.recommendComicStateContent.value" />
      </template>
      <NResult status="error" title="错误" description="审核中" v-else class="mb-1">
        <template #footer>
          <VanButton type="danger" @click="$router.back()">返回</VanButton>
        </template>
      </NResult>
  </VanPullRefresh>
</template>