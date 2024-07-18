<script setup lang='ts'>
import { ChatMessageData, isUserMessage, ChatTextMessage, ChatImageMessage, ChatInstantImageMessage, ChatReplyTextMessage, ChatReplyImageMessage, ChatReplyAudioMessage, ChatAudioMessage, ChatUserProfile, getUser } from '@/api/chat'
import Image from '@/components/image.vue'
import userIcon from '@/assets/images/userIcon.png?url'
import { computed, shallowRef, StyleValue } from 'vue'
import { useAppStore } from '@/stores'
import { useMessage } from 'naive-ui'

const $props = defineProps<{
  msg: ChatMessageData
  showName?: boolean
  style?: StyleValue
}>()
defineEmits<{
  showUser: [user: ChatUserProfile]
}>()
const appStore = useAppStore()
const isMe = computed(() => isUserMessage($props.msg) && $props.msg.data.profile.id == appStore.user()?.data._id)
const baseBoxClass = computed(() => isMe.value
  ? 'bg-[--p-color] before:bg-[--p-color] before:right-0 before:translate-x-1/2'
  : 'bg-[--van-background-2] before:bg-[--van-background-2] before:left-0 before:-translate-x-1/2')
const $message = useMessage()
const audioEl = shallowRef<HTMLAudioElement>()
</script>

<template>
  <div
    class="flex max-w-[80vw] my-2 min-h-[70px] before:content-['']  before:w-2 before:h-2 before:block before:m-0 before:!absolute before:rotate-45 relative"
    v-if="isUserMessage(msg)" :style>
    <Image :src="msg.data.profile.avatarUrl || userIcon" class="h-[2rem] w-[2rem] m-1 rounded-md"
      @click="isMe || $emit('showUser', msg.data.profile)" />
    <div class="flex flex-col ml-1 relative">
      <!-- user name -->
      <div class="text-[--van-text-color-2] text-xs flex items-center" v-if="showName && !isMe"
        @click="isMe || $emit('showUser', msg.data.profile)">
        <span class="mr-1">{{ msg.data.profile.name }}</span>
        <span class="text-[--p-color] text-[8px]">{{ msg.data.profile.title }}</span>
      </div>

      <!-- content -->
      <!-- text -->
      <Text :text="msg.data.message" v-if="(msg instanceof ChatTextMessage)" :class="[baseBoxClass]"
        class="max-w-[calc(80vw-3rem)] p-1 rounded-md shadow-sm">
        <a v-for="mo of msg.data.userMentions" class="text-[--p-color] van-haptics-feedback underline mr-1" @click.stop="() => {
          const user = getUser(mo.id)
          user ? $emit('showUser', user) : $message.info('未找到用户')
        }">
          @{{ mo.name }}
        </a>
      </Text>
      <!-- image -->
      <Image :src="msg.data.medias[0]" fit="contain" previewable class="w-[30vw] p-1 rounded-md shadow-sm"
        v-else-if="(msg instanceof ChatImageMessage)" />
      <!-- instans image -->
      <div class="w-[30vw] rounded-md shadow-sm relative" v-else-if="(msg instanceof ChatInstantImageMessage)">
        <Image :src="msg.data.medias[0]" fit="contain" previewable class="w-full rounded-md shadow-sm blur-xl" />
        <div
          class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 *:!text-white flex flex-col justify-center items-center pointer-events-none">
          <van-icon name="info-o" />
          <span>隐秘图像</span>
        </div>
      </div>
      <!-- audio -->
      <div v-else-if="(msg instanceof ChatAudioMessage)" :class="[baseBoxClass]"
        class="h-10 rounded-md shadow-sm text-xs flex items-center w-20 text-gray-400 relative"
        @click="audioEl?.play()">
        <audio controls :src="msg.data.audio" hidden class="hidden" ref="audioEl" />
        <template v-if="isMe">
          <span class="absolute left-1 text-sm">(</span>
          <span class="absolute left-[9px]">(</span>
        </template>
        <span class="ml-2">{{ msg.data.duration / 1000 }}s</span>
        <template v-if="!isMe">
          <span class="absolute right-[9px]">)</span>
          <span class="absolute right-1 text-sm">)</span>
        </template>
      </div>

      <!-- reply -->
      <NTooltip placement="bottom" trigger="click" :disabled="!(msg.data.reply instanceof ChatReplyTextMessage)"
        v-if="msg.data.reply">
        <template #trigger>
          <div
            class="mt-1 !text-[--van-text-color-2] p-1 rounded-md flex text-[10px] max-w-[50vw] bg-gray-500 bg-opacity-10">
            <span class="text-nowrap"
              @click.stop="$emit('showUser', getUser(msg.data.reply.userId)!)">{{ msg.data.reply.data.name }}:</span>
            <Text v-if="(msg.data.reply instanceof ChatReplyTextMessage)" :text="msg.data.reply.data.message"
              :ellipsis="1" class="!text-[--van-text-color-2]" />
            <Image :src="msg.data.reply.data.media" fit="contain" previewable class="w-[30vw] p-1 rounded-md shadow-sm"
              v-else-if="(msg.data.reply instanceof ChatReplyImageMessage)" />
            <Text v-else-if="(msg.data.reply instanceof ChatInstantImageMessage)" text="[隐秘图像]"
              class="!text-[--van-text-color-2]" />
            <Text v-else-if="(msg.data.reply instanceof ChatReplyAudioMessage)" text="[语音]"
              class="!text-[--van-text-color-2]" />
          </div>
        </template>
        <Text v-if="(msg.data.reply instanceof ChatReplyTextMessage)" :text="msg.data.reply.data.message"
          class="!text-white" />
      </NTooltip>

    </div>
  </div>
</template>