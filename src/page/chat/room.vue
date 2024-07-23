<script setup lang='ts'>
import { useChatStore } from '@/stores/chat'
import { createLoadingMessage } from '@/utils/message'
import { shallowRef, watch } from 'vue'
import MsgList from '@/components/chat/msgList.vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'
import { toCn } from '@/utils/translater'
import symbol from '@/symbol'
const $route = useRoute()
const app = useChatStore()
const roomId = <string>$route.params.id
const tip = window.$message.info('请关掉vpn以链接', { duration: 0 })
const loading = createLoadingMessage('载入房间中')
document.title = `加载中 | 聊天 | bika`
onBeforeRouteLeave(loading.destroy)
onBeforeRouteLeave(tip.destroy)
await new Promise<void>(r => {
  if (app.rooms) return r()
  const stop = watch(() => app.rooms, rooms => {
    if (rooms) {
      stop()
      return r()
    }
  })
})
const room = app.rooms?.find(v => v.id == roomId)!
document.title = `${room.title} | 聊天 | bika`
const conn = room?.join()
onBeforeRouteLeave(() => {
  conn.close()
})

conn.onOpen(loading.success)
conn.onOpen(tip.destroy)

const showRoomInfo = shallowRef(false)
</script>

<template>
  <VanNavBar left-arrow :title="room.title" @click-left="$router.back()" @click-right="showRoomInfo = true">
    <template #right>
      <van-icon name="info-o" size="18" />
    </template>
  </VanNavBar>
  <MsgList class="h-[calc(100%-46px)] w-full" :messages="conn.messages" />
  <Popup v-model:show="showRoomInfo" round class="h-[90vh] w-[94vw] overflow-hidden p-2" closeable>
    <Markdown :text="toCn(room.description.replaceAll(symbol.chatRoomUselessSlogan, ''))" class="w-full h-full" />
  </Popup>
</template>