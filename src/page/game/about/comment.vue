<script setup lang='ts'>
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import { useTitle } from '@vueuse/core'
import { useGameStore } from '@/stores/game'
import Comments from '@/components/comment/comment.vue'

const $route = useRoute()
const id = $route.params.id as string
const gameStore = useGameStore()

const title = computed(() => `评论 | ${gameStore.game.preload.title || ''} | bika`)
useTitle(title)

</script>

<template>
  <Comments :id list-class="h-full" stream-mode="games" />
</template>
