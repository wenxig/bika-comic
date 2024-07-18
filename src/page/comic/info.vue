<script setup lang='ts'>
import { useAppStore } from '@/stores'
import { computed } from 'vue'
import { isEmpty, toNumber } from 'lodash-es'
import Likes from '@/components/comic/info/likes.vue'
import { ProPlusComic, ProPlusMaxComic } from '@/api'
import { useTitle, reactiveComputed } from '@vueuse/core'
import config from '@/config'
import { useComicStore } from '@/stores/comic'
import Eps from '@/components/comic/info/eps.vue'
import TopInfo from '@/components/comic/info/topInfo.vue'
import Uploader from '@/components/comic/info/uploader.vue'
const app = useAppStore()
const comicStore = useComicStore()
const comic = computed(() => comicStore.comic.comic)
const preload = computed(() => !!comicStore.comic.preload ? comicStore.comic.preload : undefined)
const history = reactiveComputed(() => preload.value?._id ? (app.readHistory[preload.value?._id] ?? []) : [])
const readButtonText = computed(() => isEmpty(history) ? '开始阅读' : `继续阅读: ${(comicStore.comic.eps[config.value['bika.info.unsortComic'] ? toNumber(history[0]) - 1 : comicStore.comic.eps.length - toNumber(history[0])]?.title) ?? ''}(P${history[2] + 1})`)

const title = computed(() => ` ${preload.value?.title ?? '漫画'} | bika`)
useTitle(title)

</script>

<template>
  <template v-if="comic != false">
    <TopInfo :comic="(comic as ProPlusMaxComic) ?? (preload as ProPlusComic)" />
    <VanRow>
      <VanCol span="12">
        <VanButton class="w-full" type="primary" round :disabled="isEmpty(comicStore.comic.eps)"
          @click="!isEmpty(preload) && $router.force.push(isEmpty(history) ? `/comic/${preload?._id}/read/1` : `/comic/${preload._id}/read/${history[0]}#${history[2] + 1}`)">
          {{ readButtonText }}
        </VanButton>
      </VanCol>
      <VanCol span="4" class="justify-center !flex items-center">
        <van-badge :content="comic?.likesCount">
          <van-icon name="like" size="30px" color="var(--van-primary-color)" v-if="comic && comic.isLiked"
            @click="comic?.like()" />
          <van-icon name="like-o" size="30px" v-else color="var(--van-text-color)" @click="comic?.like()" />
        </van-badge>
      </VanCol>
      <VanCol span="4" class="justify-center !flex items-center">
        <van-icon name="star" size="30px" color="var(--van-primary-color)" v-if="comic && comic.isFavourite"
          @click="preload?.favourt()" />
        <van-icon name="star-o" size="30px" v-else color="var(--van-text-color)" @click="preload?.favourt()" />
      </VanCol>
      <VanCol span="4" class="justify-center !flex items-center"
        @click="comic?.allowComment && $router.force.push(`/comic/${preload?._id}/comments`)">
        <van-badge v-if="comic && comic.allowComment" :content="comic.commentsCount">
          <van-icon name="chat-o" size="30px" color="var(--van-text-color)" />
        </van-badge>
        <van-icon name="chat-o" size="30px" color="var(--van-text-color-2)" v-else />
      </VanCol>
    </VanRow>
    <Uploader :comic />
    <Eps v-if="preload" :id="preload._id" :eps="comicStore.comic.eps" />
    <Likes :likes="comicStore.comic.likeComic" />
  </template>
  <NResult status="error" title="错误" description="审核中" v-else class="mb-1">
    <template #footer>
      <VanButton type="danger" @click="$router.back()">返回</VanButton>
    </template>
  </NResult>
</template>