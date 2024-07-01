<script setup lang='ts'>
import { useRoute } from 'vue-router';
import { computed, shallowRef } from 'vue';
import CommentSender from './commentSender.vue';
import Comments from '@/components/comment.vue';
import { useTitle } from '@vueuse/core';
import { useGameStore } from '@/stores/game';

const $route = useRoute()
const id = $route.params.id as string
const commentSender = shallowRef<InstanceType<typeof CommentSender>>()
const gameStore = useGameStore()

const title = computed(() => `评论 | ${gameStore.game.preload.title || ''} | bika`)
useTitle(title)

</script>

<template>
  <Comments :id list-class="h-full" @comment="c => commentSender?.show(c, true)" stream-mode="games" />
  <CommentSender ref="commentSender" />
  <van-floating-bubble magnetic="x" axis="xy" icon="chat" @click="commentSender?.show(gameStore.game.game!, false)" />
</template>
