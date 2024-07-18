<script setup lang='ts'>
import { User } from '@/api'
import { readonly, shallowRef } from 'vue'
import Popup from '@/components/popup.vue'
import { ChatUserProfile } from '@/api/chat'

const show = shallowRef(false)
const user = shallowRef<User | ChatUserProfile>()

defineExpose({
  show(u: User | ChatUserProfile) {
    user.value = u
    show.value = true
  },
  isShowing: readonly(show),
  close() {
    show.value = false
  }
})
</script>

<template>
  <Popup v-model:show="show" round closeable position="bottom" no-border>
    <div class="min-h-[33vh] w-full h-full flex justify-center items-start backdrop-blur-lg">
      <UserInfo :user />
    </div>
  </Popup>
</template>