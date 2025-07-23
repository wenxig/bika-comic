<script setup lang='ts'>
import ComicView from '@/components/comic/comicView.vue'
import { useAppStore } from '@/stores'
import { remove } from 'lodash-es'
import { shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
const comicView = shallowRef<InstanceType<typeof ComicView>>()
const $route = useRoute()
const $router = useRouter()
const startPosition = Number($route.hash.substring(1)) || 0
watch(() => comicView.value?.index, page => {
  if (page || page == 0) $router.force.replace($route.fullPath.includes('#') ? $route.fullPath.replace(/#.+/g, `#${page + 1}`) : `${$route.fullPath}#${page + 1}`)
}, { immediate: true })
const app = useAppStore()
</script>

<template>
  <ComicView show :images="app.favouriteImages.map(v => v.src)" comic-title="图片收藏" ref="comicView"
    @remove-favourite-image="src => {
      remove(app.favouriteImages, { src })
      if (app.favouriteImages.length == 0) $router.force.replace('/user/image')
    }" @back="$router.back()" :startPosition>
  </ComicView>
</template>