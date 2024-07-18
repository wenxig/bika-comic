import { getChatRooms, type Room } from "@/api/chat"
import type { AxiosRequestConfig } from "axios"
import { defineStore } from "pinia"
import { shallowRef } from "vue"

export const useChatStore = defineStore('chat', () => {
  const rooms = shallowRef<Room[]>()
  const $reloadChatRooms = (config: AxiosRequestConfig = {}) => getChatRooms(config).then(rs => rooms.value = rs)
  $reloadChatRooms()
  return {
    rooms,
    $reload: {
      chatRooms: $reloadChatRooms
    }
  }
})