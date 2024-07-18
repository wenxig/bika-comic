<script setup lang='ts'>
import config from '@/config'
import { useAppStore } from '@/stores'
import symbol from '@/symbol'
import dayjs from 'dayjs'
import { isEmpty } from 'lodash-es'
import { computed, provide, shallowRef, watch } from 'vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'
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


const tabberBottomPadding = shallowRef(50)
const showTabbar = shallowRef(true)
provide(symbol.showTabbar, showTabbar)
watch(showTabbar, showTabbar => {
  tabberBottomPadding.value = (showTabbar ? 50 : 0)
})
onBeforeRouteLeave(() => {
  showTabbar.value = true
})
</script>

<template>
  <div
    class="w-full overflow-hidden duration-200 transition-[margin-bottom,height] h-[calc(100%-var(--tabber-bottom-padding))] mb-[--tabber-bottom-padding]">
    <Suspense>
      <router-view v-slot="{ Component }">
        <component :is="Component" />
      </router-view>
    </Suspense>
  </div>
  <VanTabbar
    class="fixed bottom-0 transition-transform translate-y-[calc(54px-var(--tabber-bottom-padding))] w-full !pb-[4px] "
    :model-value="name" @change="v => $router.force.replace(`/main/${v}`)">
    <van-tabbar-item name="home" icon="home-o">主页</van-tabbar-item>
    <van-tabbar-item name="subscribe" icon="eye-o" v-if="config.value['bika.plusPlan']"
      :dot="!isEmpty(getComics()) && (config.value['bika.subscribe.updateTime'] != newDateString)"
      @click="config.value['bika.subscribe.updateTime'] = newDateString">关注</van-tabbar-item>
    <van-tabbar-item name="chat" icon="chat-o">泡泡</van-tabbar-item>
    <van-tabbar-item name="user" icon="user-o">我的</van-tabbar-item>
  </VanTabbar>
</template>

<style scoped lang='scss'>
* {
  --tabber-bottom-padding: calc(v-bind(tabberBottomPadding) * 1px);
}
</style>