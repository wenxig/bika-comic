<script setup lang='ts'>
import { FavouriteImage } from '@/api/plusPlan'
import { remove } from 'lodash-es'
import { onMounted, shallowRef } from 'vue'
import { SmartAbortController } from '@/utils/requset'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import { useAppStore } from '@/stores'
import config from '@/config'
import List from '@/components/list.vue'
import { userPageScroll } from '@/stores/temp'
import symbol from '@/symbol'
import { spiltAnthors, toCn } from '@/utils/translater'
document.title = '图片收藏 | bika'
const $router = useRouter()
const app = useAppStore()
const sac = new SmartAbortController()
const isRefreshing = shallowRef(false)
const resyncSaveImages = () => new Promise<FavouriteImage[]>((ok, fail) => {
  if (config.value['bika.plusPlan']) {
    isRefreshing.value = true
    sac.abort()
    app.$reload.favouriteImages({ signal: sac.signal })
      .then(() => {
        ok(<FavouriteImage[]>app.favouriteImages)
      }).catch((err) => {
        fail(err)
      }).finally(() => {
        isRefreshing.value = false
      })
  } else {
    isRefreshing.value = false
    ok(<FavouriteImage[]>app.favouriteImages)
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
</script>

<template>
  <VanNavBar title="图片收藏" left-text="返回" left-arrow @click-left="$router.back()" />
  <div class="w-full h-10 van-hairline--bottom items-center bg-(--van-background-2] flex" v-if="app.favouriteImages[0)">
    <div class="text-(--van-text-color-2) ml-2 van-haptics-feedback" @click="$router.force.push('/user/image/read')">
      开始阅读</div>
  </div>
  <List :is-requesting="isRefreshing" reloadable @reload="then => resyncSaveImages().then(then)"
    class="h-[calc(100%-2.5rem-46px)]" :data="isRefreshing ? [] : app.favouriteImages" :item-height="140"
    v-slot="{ height, data: { item, index } }" ref="list">
    <van-swipe-cell class="w-full relative" style="--van-checkbox-duration: 0s;" :style="{ height: `${height}px` }">
      <button :height @click="() => $router.force.push(`/user/image/read#${index}`)" :style="{ height: `${height}px` }"
        class="overflow-hidden w-full van-hairline--bottom flex bg-center bg-(--van-background-2] text-[--van-text-color) border-none relative active:bg-gray p-0 items-start">
        <Image :src="item.src" class="ml-[2%] w-[30%] h-full z-[2]" fit="contain" />
        <div class="w-[62%] min-h-[98%] *:text-sm flex absolute right-[2%] flex-col *:text-justify">
          <span class="font-bold van-ellipsis">
            {{ item.meta.title }}
          </span>
          <div class="text-(--van-primary-color) flex flex-wrap *:text-nowrap van-ellipsis">
            <span>作者：</span>
            <span v-for="author of spiltAnthors(item.meta?.author)" class="mr-2 van-haptics-feedback underline"
              @click="$router.force.push(`/search?keyword=${author}&mode=anthor`)">{{ author }}</span>
          </div>
          <div class="my-1 w-full h-auto">
            <van-tag type="primary" v-for="tag of item.meta.categories.slice(0, symbol.comicCardMaxTagsShow)"
              class="mr-1 *:!text-nowrap !text-nowrap">{{ toCn(tag) }}</van-tag>
            <van-tag type="primary" plain v-if="item.meta.categories.length > symbol.comicCardMaxTagsShow"
              class="mr-1 *:!text-nowrap !text-nowrap">...</van-tag>
          </div>
        </div>
      </button>
      <template #right>
        <van-button square text="前往原漫画" type="primary" class="h-full"
          @click="$router.force.push(`/comic/${item.meta.id}/info`)" />
        <van-button square text="删除" type="danger" class="h-full"
          @click=" remove(app.favouriteImages, { src: item.src })" />
      </template>
    </van-swipe-cell>
  </List>
</template>