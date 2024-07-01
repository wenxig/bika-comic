<script setup lang='ts'>
import { ProComic } from '@/api';
import { isEmpty } from 'lodash-es';
withDefaults(defineProps<{
  likes?: ProComic[]
  mode?: 'push' | 'replace'
}>(), {
  mode: 'push'
})
</script>

<template>
  <div class="w-full van-hairline--top">
    <div class="w-full text-xl font-bold text-[--van-primary-color] flex items-center h-9 pl-1 pt-2">相似漫画</div>
    <div class="flex justify-center w-full mt-2" v-if="likes && isEmpty(likes)">
      <van-loading size="24px">加载中...</van-loading>
    </div>
    <ComicCard v-for="comic of likes" :mode :comic="comic" :height="160"></ComicCard>
  </div>
</template>