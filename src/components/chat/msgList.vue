<script setup lang='ts'>
import { ChatMessageData } from '@/api/chat'
import Message from './message.vue'
import { shallowRef, watch } from 'vue'
import { useScroll } from '@vueuse/core'
import PreviewUser from '@/components/user/previewUser.vue'
const $props = defineProps<{
  messages: ChatMessageData[]
  class?: any
}>()
const list = shallowRef<HTMLDivElement>()
const listScroll = useScroll(list, { behavior: 'smooth' })
const showBackToBottom = shallowRef(false)
const scrollToBottom = () => listScroll.y.value = (list.value?.scrollHeight ?? Infinity) + 8
watch(() => listScroll.arrivedState.bottom, v => v && (showBackToBottom.value = false))
watch($props, () => {
  if (listScroll.y.value == 0 || (list.value!.scrollHeight - listScroll.y.value < 1000)) scrollToBottom()
  else {
    console.log('not in bottom, do not scroll')
    showBackToBottom.value = true
  }
}, { immediate: true, flush: 'post' })

const previewUser = shallowRef<InstanceType<typeof PreviewUser>>()
</script>

<template>
  <div ref="list" class="overflow-y-auto overflow-x-hidden" :class>
    <Message v-for="message of messages" :msg="message" show-name @show-user="previewUser?.show" />
  </div>
  <Transition name="van-slide-right">
    <div v-if="showBackToBottom" @click="scrollToBottom()"
      class="fixed top-[50px] right-1 w-20 shadow-md text-[--p-color] rounded-l-full flex justify-center items-center h-6 bg-[--van-background-2] text-xs">
      <van-icon name="arrow-double-right" class="rotate-90" />
      有新消息
    </div>
  </Transition>
  <PreviewUser ref="previewUser" />
</template>