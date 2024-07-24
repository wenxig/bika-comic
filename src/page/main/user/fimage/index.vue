<script setup lang='ts'>
import { FavourtImage } from '@/api/plusPlan'
import { remove } from 'lodash-es'
import { onMounted, shallowRef } from 'vue'
import { SmartAbortController } from '@/utils/requset'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import { useAppStore } from '@/stores'
import config from '@/config'
import List from '@/components/list.vue'
import { userPageScroll } from '@/stores/temp'
import { useComicStore } from '@/stores/comic'
document.title = '图片收藏 | bika'
const $router = useRouter()
const app = useAppStore()
const sac = new SmartAbortController()
const isRefreshing = shallowRef(false)
const resyncSaveImages = () => new Promise<FavourtImage[]>((ok, fail) => {
  if (config.value['bika.plusPlan']) {
    isRefreshing.value = true
    sac.abort()
    app.$reload.favourtImages({ signal: sac.signal })
      .then(() => {
        ok(<FavourtImage[]>app.favourtImages.value)
      }).catch((err) => {
        fail(err)
      }).finally(() => {
        isRefreshing.value = false
      })
  } else {
    isRefreshing.value = false
    ok(<FavourtImage[]>app.favourtImages.value)
  }
})
onBeforeRouteLeave(() => sac.abort())

const list = shallowRef<GenericComponentExports<typeof List>>()
onMounted(() => {
  list.value?.listInstanse?.scrollTo({ top: userPageScroll.image })
})
onBeforeRouteLeave(() => {
  if (list.value?.scrollTop) userPageScroll.image = list.value?.scrollTop
})
const comicStore = useComicStore()
</script>

<template>
  <VanNavBar title="图片收藏" left-text="返回" left-arrow @click-left="$router.back()" />
  <div class="w-full h-10 van-hairline--bottom items-center bg-[--van-background-2] flex"
    v-if="app.favourtImages.value[0]">
    <div class="text-[--van-text-color-2] ml-2 van-haptics-feedback" @click="$router.force.push('/user/image/read')">
      开始阅读</div>
  </div>
  <List :is-requesting="isRefreshing" reloadable @reload="then => resyncSaveImages().then(then)"
    class="h-[calc(100%-2.5rem-46px)]" :data="isRefreshing ? [] : app.favourtImages.value" :item-height="140"
    v-slot="{ height, data: { item, index } }" ref="list">
    <van-swipe-cell class="w-full relative" style="--van-checkbox-duration: 0s;" :style="{ height: `${height}px` }">
      <ComicCard :comic="item.comic" :height :when-click="() => $router.force.push(`/user/image/read#${index}`)"
        hide-ep-info hide-view-number>
        <template #cover>
          <Image :src="item.src" fit="contain" class="ml-[2%] w-[30%] h-full" />
        </template>
      </ComicCard>
      <template #right>
        <van-button square text="前往原漫画" type="primary" class="h-full"
          @click="comicStore.$setupPreload(item.comic); $router.force.push(`/comic/${item.comic._id}/info`)" />
        <van-button square text="删除" type="danger" class="h-full"
          @click=" remove(app.favourtImages.value, { src: item.src })" />
      </template>
    </van-swipe-cell>
  </List>
</template>