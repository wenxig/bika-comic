<script setup lang='ts'>
import { createLoadingMessage } from '@/utils/message'
import { shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
const $route = useRoute()
const $router = useRouter()
document.title = '聊天 | bika'
const selectPage = shallowRef($route.path.substring($route.path.lastIndexOf('/') + 1))
const beforeChange = async (t: string) => {
  const loading = createLoadingMessage()
  await loading.bind($router.force.replace(`/main/home/level/${t}`), false)
  return true
}
</script>

<template>
  <VanTabs class="w-full" :beforeChange v-model:active="selectPage">
    <VanTab title="房间" name="room" />
    <!-- <VanTab title="好友" name="friend" /> -->
  </VanTabs>
  <div class="h-[calc(100%-44px)] w-full">
    <RouterView />
  </div>
</template>