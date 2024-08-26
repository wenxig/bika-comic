<script setup lang='ts'>
import config from '@/config'
import { useAppStore } from '@/stores'
import dayjs from 'dayjs'
import { isEmpty } from 'lodash-es'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
const route = useRoute()
const name = computed(() => route.path.match(/(?<=\/main\/)\w+(?=\/)?/g)?.[0])
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
const newDateString = dayjs().format("YYYY-MM-DD")
</script>

<template>
  <div class="w-full overflow-hidden h-[calc(100%-50px)]">
    <Suspense>
      <router-view v-slot="{ Component }">
        <component :is="Component" />
      </router-view>
    </Suspense>
  </div>
  <VanTabbar class="fixed bottom-0 transition-[opacity] opacity-100 w-full" :model-value="name"
    @change="v => $router.force.replace(`/main/${v}`)">
    <van-tabbar-item name="home" icon="home-o">主页</van-tabbar-item>
    <van-tabbar-item name="subscribe" icon="eye-o" v-if="config['bika.plusPlan']"
      :dot="!isEmpty(getComics()) && (config['bika.subscribe.updateTime'] != newDateString)"
      @click="config['bika.subscribe.updateTime'] = newDateString">关注</van-tabbar-item>
    <van-tabbar-item name="chat" icon="chat-o">泡泡</van-tabbar-item>
    <van-tabbar-item name="user" icon="user-o">我的</van-tabbar-item>
  </VanTabbar>
</template>