<script setup lang='ts'>
import { ProComic } from '@/api'
import { useComicStore } from '@/stores/comic'
import { StateContentData } from '@/utils/requset'
withDefaults(defineProps<{
  likes?: ProComic[]
  mode?: 'push' | 'replace',
  state?: StateContentData<ProComic[]>
}>(), {
  mode: 'push'
})
const comicStore = useComicStore()
</script>

<template>
  <div class="w-full van-hairline--top">
    <div class="w-full text-xl font-bold text-[--van-primary-color] flex items-center h-9 pl-1 pt-2">相似漫画</div>
    <StateContent :is-empty="state?.isEmpty" :is-error="state?.isError" :is-loading="state?.isLoading ?? true" retriable
      @retry="comicStore.$retryLike">
      <ComicCard v-for="comic of likes" :mode :comic :height="160"></ComicCard>
    </StateContent>
  </div>
</template>