<script setup lang='ts'>
import { ProComic, ProPlusComic } from '@/api'
import { Subscribe, removeSubscribe } from '@/api/plusPlan'
import userIcon from '@/assets/images/userIcon.png?url'
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
defineEmits<{
  userSelect: []
}>()
const isRequesting = shallowRef(false)
const deleteSubscribe = async () => {
  isRequesting.value = true
  const loading = createLoadingMessage('订阅中')
  try {
    await removeSubscribe([$props.subscribe.id])
    loading.success()
    await $router.force.replace('/main/subscribe')
    isRequesting.value = false
  } catch {
    loading.fail()
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
      <NTime v-if="(comic instanceof ProPlusComic)" :time="new Date(comic.updated_at)"
        class="block top-1 right-1 absolute text-[--van-text-color-2]" />
    </div>
    <ComicCard :height="height - 40" :comic />
  </div>
</template>