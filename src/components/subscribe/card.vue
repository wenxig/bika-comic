<script setup lang='ts'>
import { ProComic, ProPlusComic } from '@/api'
import { Subscribe } from '@/api/plusPlan'
import userIcon from '@/assets/images/userIcon.webp?url'
import { createLoadingMessage } from '@/utils/message'
import { shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import SubscribeButton from '@/components/subscribe/sButton.vue'
const $router = useRouter()
const $props = defineProps<{
  height: number,
  subscribe: Subscribe,
  comic: ProPlusComic | ProComic
}>()
const $emit = defineEmits<{
  userSelect: []
  remove: []
}>()
const isRequesting = shallowRef(false)
const deleteSubscribe = async () => {
  isRequesting.value = true
  const loading = createLoadingMessage('取关中')
  try {
    loading.bind(Subscribe.remove([$props.subscribe.id]))
    $emit('remove')
    isRequesting.value = false
  } catch {
    isRequesting.value = false
  }
}

const goSearch = () => $router.force.push(`/search?keyword=${$props.subscribe.type == 'uploader' ? encodeURIComponent($props.subscribe.name) : $props.subscribe.id}&mode=${$props.subscribe.type}`)
</script>

<template>
  <div class="flex flex-col bg-[--van-background-2] w-full van-hairline--top-bottom" :style="`height: ${height}px;`">
    <div class="w-full h-[50px] flex items-center relative" @click="$emit('userSelect')">
      <Image :src="subscribe.src ?? userIcon" round class="w-[40px] h-[40px] mx-2" @click="goSearch" />
      <span @click="goSearch">{{ subscribe.name }}</span>
      <SubscribeButton :is-subscribes="true" :size="24" class="ml-1 p-1" @delete-subscribe="deleteSubscribe()" />
      <NTime v-if="comic && !(comic instanceof ProComic)" :time="new Date(comic.updated_at)"
        class="block top-1 right-1 absolute text-[--van-text-color-2]" />
    </div>
    <ComicCard :height="height - 40" :comic />
  </div>
</template>