<script setup lang='ts'>
import config from '@/config'
import { useAppStore } from '@/stores'
import { isEmpty } from 'lodash-es'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
const route = useRoute()
const name = computed(() => route.path.match(/(?<=\/main\/)\w+(?=\/)?/g)![0])
const app = useAppStore()
const getComics = () => app.newUpdateComics?.map(v => {
  for (const user of app.subscribes) {
    switch (user.type) {
      case 'translater': {
        if (v.chineseTeam == user.id) return { subscribe: user, comic: v }
        else return undefined
      }
      case 'anthor': {
        if (v.author == user.id) return { subscribe: user, comic: v }
        else return undefined
      }
      case 'uploader': {
        return undefined
      }
    }
  }
}).filter(v => !!v)
const newDate = new Date()
const newDateString = `${newDate.getFullYear()}-${newDate.getMonth()}-${newDate.getDate()}`
</script>

<template>
  <div
    class="h-[calc(100vh-var(--van-tabbar-height))] w-full pb-[calc(var(--van-tabbar-height)+6rem)] overflow-y-auto overflow-x-hidden"
    id="homeRoot">
    <Suspense>
      <router-view v-slot="{ Component }">
        <component :is="Component" />
      </router-view>
    </Suspense>
  </div>
  <VanTabbar class="fixed bottom-0 w-full" :model-value="name" @change="v => $router.force.replace(`/main/${v}`)">
    <van-tabbar-item name="home" icon="home-o">主页</van-tabbar-item>
    <van-tabbar-item name="subscribe" icon="eye-o" v-if="config.value.plusPlan"
      :dot="!isEmpty(getComics()) && (config.value.updateSub != newDateString)"
      @click="config.value.updateSub = newDateString">关注</van-tabbar-item>
    <van-tabbar-item name="user" icon="user-o">用户</van-tabbar-item>
    <van-tabbar-item name="setting" icon="setting-o">设置</van-tabbar-item>
  </VanTabbar>
</template>