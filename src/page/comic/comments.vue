<script setup lang='ts'>
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import Comments from '@/components/comment/comment.vue'
import { useTitle } from '@vueuse/core'
import { useComicStore } from '@/stores/comic'

const $route = useRoute()
const id = $route.params.id as string
const comicStore = useComicStore()

const title = computed(() => `评论 | ${comicStore.now?.union.value?.title || '漫画::加载中'} | bika`)
useTitle(title)

</script>

<template>
  <Comments :id list-class="h-[calc(100%-40px)]" />
</template>
