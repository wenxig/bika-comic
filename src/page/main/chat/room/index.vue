<script setup lang='ts'>
import List from '@/components/list.vue'
import { useChatStore } from '@/stores/chat'
import symbol from '@/symbol'
const chatS = useChatStore()
if (!chatS.rooms) chatS.$reload.chatRooms()
</script>

<template>
  <List :is-requesting="!chatS.rooms" :data="chatS.rooms ?? []" :item-height="160"
    v-slot="{ height, data: { item: room } }" class="h-full">
    <div :style="{ height: `${height}px` }" @click="$router.push(`/chat/room/${room.id}`)"
      class="overflow-hidden w-full van-hairline--bottom flex  bg-[--van-background-2] text-[--van-text-color] border-none relative active:bg-gray p-0 items-start">
      <Image :src="room.icon" class="ml-[2%] w-[30%] h-full relative z-10" fit="contain" />
      <div class="w-[62%] min-h-[98%] *:text-sm flex absolute right-[2%] flex-col *:text-justify">
        <div class="font-bold van-ellipsis !text-lg">
          {{ room.title }}
        </div>
        <Markdown :text="room.description.replaceAll(symbol.chatRoomUselessSlogan, '')" class="w-full h-full" />
      </div>
    </div>
  </List>
</template>