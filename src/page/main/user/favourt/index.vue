<script setup lang='ts'>
import { useAppStore } from '@/stores'
import { isEmpty, times } from 'lodash-es'
import List from '@/components/list.vue'
import { userPageScroll } from '@/stores/temp'
import { onMounted, shallowReactive, shallowRef } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { createLoadingMessage } from '@/utils/message'
document.title = '我的收藏 | bika'
const app = useAppStore()

const list = shallowRef<GenericComponentExports<typeof List>>()
onMounted(() => {
  list.value?.listInstanse?.scrollTo({ top: userPageScroll.favourt })
})
onBeforeRouteLeave(() => {
  if (list.value?.scrollTop) userPageScroll.favourt = list.value?.scrollTop
})

const isBatchDeletingFavourt = shallowRef(false)
const batchDeleteFavourtList = shallowReactive<boolean[]>([])
const isBatchDeletingFavourting = shallowRef(false)
const batchRemoveFavourtList = async () => {
  const loading = createLoadingMessage('删除中')
  isBatchDeletingFavourting.value = true
  isBatchDeletingFavourt.value = false
  try {
    await Promise.all(batchDeleteFavourtList.map((v, index) => {
      console.log('batch remove:', v, index, app.user()?.favourite.docs.value[index])
      if (v) return (app.user()?.favourite.docs.value ?? [])[index].favourt({}, false)
    }))
    await app.$reload.me()
    batchDeleteFavourtList.splice(0, Infinity)
    loading.success()
  } catch {
    loading.fail()
  }
  isBatchDeletingFavourting.value = false
}
const batchRemoveFavourtListSelectAll = () => times(app.user()?.favourite.total.value ?? 0, index => batchDeleteFavourtList[index] = true)
const batchRemoveFavourtListSelectTog = () => times(app.user()?.favourite.total.value ?? 0, index => batchDeleteFavourtList[index] = !batchDeleteFavourtList[index])

const loadNext = async () => {
  const loading = createLoadingMessage()
  try {
    await app.user()?.favourite.next()
    loading.success()
  } catch {
    loading.fail()
  }
}
</script>

<template>
  <VanNavBar title="我的收藏" left-text="返回" left-arrow @click-left="$router.back()">
    <template #right>
      <template v-if="isBatchDeletingFavourt">
        <div class="text-[--p-color] van-haptics-feedback mr-1" @click="batchRemoveFavourtList">确定</div>
        <div class="text-[--p-color] van-haptics-feedback mr-1" @click="batchRemoveFavourtListSelectTog">反转</div>
        <div class="text-[--p-color] van-haptics-feedback" @click="batchRemoveFavourtListSelectAll">全选</div>
      </template>
      <div class="text-[--p-color] van-haptics-feedback" v-else @click="isBatchDeletingFavourt = true">删除</div>
    </template>
  </VanNavBar>
  <List :item-height="160" :reloadable="!isBatchDeletingFavourt"
    @reload="then => { app.user()?.favourite.reload(); app.user()?.favourite.next().then(then) }"
    class="h-[calc(100%-46px)] w-full" :data="app.user()?.favourite.docs.value ?? []" ref="list"
    :is-requesting="isEmpty(app.user()) || !!app.user()?.favourite.isRequesting.value"
    v-slot="{ height, data: { item: comic, index } }" @next="loadNext()"
    :end="isEmpty(app.user()) ? false : (app.user()!.favourite.done.value)">
    <div class="w-full relative" style="--van-checkbox-duration: 0s;" :style="{ height: `${height}px` }">
      <ComicCard :comic :height />
      <div @click="isBatchDeletingFavourt && (batchDeleteFavourtList[index] = !batchDeleteFavourtList[index])"
        v-if="isBatchDeletingFavourting || isBatchDeletingFavourt" class="w-full h-full absolute top-0 left-0"
        :class="[!isBatchDeletingFavourt && 'hidden']">
        <VanCheckbox :model-value="batchDeleteFavourtList[index]" class="absolute bottom-1 right-1"
          v-if="isBatchDeletingFavourt" />
      </div>
    </div>
  </List>
</template>
