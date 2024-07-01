<script setup lang='ts'>
import { useGameStore } from '@/stores/game'
import { computed } from 'vue'
const gameStore = useGameStore()
const title = computed(() => gameStore.game.preload?.title ?? gameStore.game.game?.title ?? '')

</script>

<template>
  <van-nav-bar :title left-text="返回" left-arrow @click-left="$router.back()" right-text="首页"
    @click-right="$router.force.replace('/')" />
  <div
    class="w-full h-[calc(100vh-var(--van-nav-bar-height))] overflow-x-hidden overflow-y-auto bg-[--van-background-2]">
    <RouterView />
  </div>
</template>