<script setup lang='ts'>
import { FavourtImage } from '@/api/plusPlan'
import { remove } from 'lodash-es'
import { shallowRef } from 'vue'
import ComicView from '@/components/comic/comicView.vue'
import { SmartAbortController } from '@/utils/requset'
import { onBeforeRouteLeave } from 'vue-router'
import { useAppStore } from '@/stores'
import config from '@/config'
const comicView = shallowRef<InstanceType<typeof ComicView>>()
const show = shallowRef(false)
const app = useAppStore()
const sac = new SmartAbortController()
const isRefreshing = shallowRef(false)
const resyncSaveImages = () => new Promise<FavourtImage[]>((ok, fail) => {
  if (config.value['bika.plusPlan']) {
    isRefreshing.value = true
    sac.abort()
    app.$reload.favourtImages({ signal: sac.signal })
      .then(() => {
        ok(app.favourtImages.value)
      }).catch((err) => {
        fail(err)
      }).finally(() => {
        isRefreshing.value = false
      })
  } else {
    isRefreshing.value = false
    ok(app.favourtImages.value)
  }
})
onBeforeRouteLeave(() => sac.abort())
</script>

<template>
  <VanNavBar title="图片收藏" left-text="返回" left-arrow @click-left="$router.back()" />
  <div class="w-full h-10 van-hairline--bottom items-center bg-[--van-background-2] flex"
    v-if="app.favourtImages.value[0]">
    <div class="text-[--van-text-color-2] ml-2" @click="() => {
      comicView?.toIndex(0)
      show = true
    }">开始阅读</div>
  </div>
  <List :is-requesting="isRefreshing" reloadable @reload="then => resyncSaveImages().then(then)"
    class="h-[calc(100%-2.5rem-46px)]" :data="isRefreshing ? [] : app.favourtImages.value" :item-height="100"
    v-slot="{ height, data: { item, index } }">
    <button class="w-full van-hairline--bottom bg-[--van-background-2] flex items-center border-none relative"
      :style="{ height: `${height}px` }">
      <Image :src="item.src" class="ml-[2%] w-[30%]" fit="contain" />
      <div class="w-[62%] h-[98%] *:text-sm flex absolute right-[2%] justify-end">
        <VanButton type="primary" class="!h-full mr-[2px]" style="writing-mode: vertical-lr;" @click="() => {
          comicView?.toIndex(index)
          show = true
        }">从此开始</VanButton>
        <VanButton type="danger" class="!h-full" style="writing-mode: vertical-lr;"
          @click="remove(app.favourtImages.value, v => v.src == item.src)">删除
        </VanButton>
      </div>
    </button>
  </List>
  <ComicView :show :images="app.favourtImages.value.map(v => v.src)" comic-title="图片收藏" @back="show = false"
    ref="comicView">
    <template #menu>
      <div>
        <van-icon name="minus" size="2rem" class="-mb-1"
          @click="remove(app.favourtImages.value, (_v, index) => index == comicView?.index)" />
        移除
      </div>
    </template>
  </ComicView>
</template>