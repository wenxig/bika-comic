<script setup lang='ts'>
import { useRoute } from 'vue-router'
import { computed, onUnmounted, shallowRef } from 'vue'
import CommentSender from '@/components/comic/comment/commentSender.vue'
import Comments from '@/components/comic/comment/comment.vue'
import { useTitle } from '@vueuse/core'
import { useComicStore } from '@/stores/comic'
import { useZIndex } from '@/utils/layout'

const $route = useRoute()
const id = $route.params.id as string
const commentSender = shallowRef<InstanceType<typeof CommentSender>>()
const comicStore = useComicStore()

const title = computed(() => `评论 | ${comicStore.comic.preload?.title || ''} | bika`)
useTitle(title)

const showCommentButtonZIndex = shallowRef(true)
const [sendCommentButtonZIndex] = useZIndex(showCommentButtonZIndex)
onUnmounted(() => void (showCommentButtonZIndex.value = false))
</script>

<template>
  <Comments :id list-class="h-full" @comment="c => commentSender?.show(c, true)" />
  <CommentSender ref="commentSender" />
  <van-floating-bubble magnetic="x" axis="xy" icon="chat" :style="{ zIndex: sendCommentButtonZIndex }"
    @click="comicStore.comic.comic && commentSender?.show(comicStore.comic.comic, false)" />
</template>
