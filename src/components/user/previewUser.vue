<script setup lang='ts'>
import { User } from '@/api'
import { shallowRef } from 'vue'
import Popup from '@/components/popup.vue'

const show = shallowRef(false)
const user = shallowRef<User>()

defineExpose({
  show(u: User) {
    user.value = u
    show.value = true
  },
  isShowing: show,
  close() {
    show.value = false
  }
})
</script>

<template>
  <Popup v-model:show="show" round closeable position="bottom" no-border>
    <div class="w-full h-full flex justify-center items-start  backdrop-blur-lg">
      <UserInfo :user />
    </div>
  </Popup>
</template>