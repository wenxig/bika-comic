<script setup lang='ts'>
import { createLoadingMessage } from '@/utils/message'
import { Interceptor } from 'vant/lib/utils'
import { shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
const $route = useRoute()
const $router = useRouter()
document.title = '排行榜 | bika'
console.log('in level page');

const selectPage = shallowRef($route.path.substring($route.path.lastIndexOf('/') + 1))
const beforeChange: Interceptor = async (t: string) => {
  const loading = createLoadingMessage()
  try {
    await $router.force.replace(`/main/home/level/${t}`)
    loading.success()
  } catch {
    loading.fail()
  }
  return true
}
</script>

<template>
  <VanTabs class="w-full" :beforeChange v-model:active="selectPage">
    <VanTab title="日榜" name="day" />
    <VanTab title="周榜" name="week" />
    <VanTab title="月榜" name="month" />
    <VanTab title="骑士榜" name="user" />
  </VanTabs>
  <div class="h-[calc(100%-44px)] w-full">
    <RouterView />
  </div>
</template>