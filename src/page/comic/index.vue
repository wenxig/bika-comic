<script setup lang='ts'>
import { useComicStore } from '@/stores/comic'
import { computed } from 'vue'
const comicStore = useComicStore()
const title = computed(() => comicStore.now?.union.value?.title || '')

</script>

<template>
  <van-nav-bar :title left-text="返回" left-arrow @click-left="$router.back()" right-text="首页"
    @click-right="$router.force.replace('/')" />
  <div
    class="w-full h-[calc(100vh-var(--van-nav-bar-height))] overflow-x-hidden overflow-y-auto bg-[--van-background-2]">
    <RouterView />
  </div>
</template>