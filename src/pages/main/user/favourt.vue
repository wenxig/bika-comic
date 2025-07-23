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
  list.value?.listInstanse?.scrollTo({ top: userPageScroll.favourite })
})
onBeforeRouteLeave(() => {
  if (list.value?.scrollTop) userPageScroll.favourite = list.value?.scrollTop
})

class BatchRemoveFavourite {
  public static isSetecting = shallowRef(false)
  public static list = shallowReactive<boolean[]>([])
  public static isDeleting = shallowRef(false)
  public static remove = async () => {
    const loading = createLoadingMessage('删除中')
    BatchRemoveFavourite.isDeleting.value = true
    BatchRemoveFavourite.isSetecting.value = false
    try {
      await Promise.all(BatchRemoveFavourite.list.map((v, index) => {
        const favouriteComicList = app.user()?.favourite.docs.value
        console.log('batch remove:', v, index, favouriteComicList?.[index])
        if (v) return (favouriteComicList ?? [])[index].favourite({}, false)
      }))
      await app.$reload.me()
      BatchRemoveFavourite.list.splice(0, Infinity)
      loading.success()
    } catch {
      loading.fail()
    }
    BatchRemoveFavourite.isDeleting.value = false
  }
  public static cancel = () => {
    BatchRemoveFavourite.isSetecting.value = false
    BatchRemoveFavourite.isDeleting.value = false
    BatchRemoveFavourite.list.splice(0, Infinity)
  }
  public static selectAll = () => times(app.user()?.favourite.total.value ?? 0, index => BatchRemoveFavourite.list[index] = true)
  public static selectTog = () => times(app.user()?.favourite.total.value ?? 0, index => BatchRemoveFavourite.list[index] = !BatchRemoveFavourite.list[index])
}


const loadNext = async () => {
  const loading = createLoadingMessage()
  await loading.bind(app.user()?.favourite.next())
}
</script>

<template>
  <VanNavBar title="我的收藏" left-text="返回" left-arrow @click-left="$router.back()">
    <template #right>
      <template v-if="BatchRemoveFavourite.isSetecting.value">
        <NButton :disabled="BatchRemoveFavourite.isDeleting.value" text type="primary" class="mr-2"
          @click="BatchRemoveFavourite.remove">确定
        </NButton>
        <NButton :disabled="BatchRemoveFavourite.isDeleting.value" text type="primary" class="mr-2"
          @click="BatchRemoveFavourite.cancel">取消
        </NButton>
        <NButton :disabled="BatchRemoveFavourite.isDeleting.value" text type="primary" class="mr-2"
          @click="BatchRemoveFavourite.selectTog">反转</NButton>
        <NButton :disabled="BatchRemoveFavourite.isDeleting.value" text type="primary"
          @click="BatchRemoveFavourite.selectAll">
          全选</NButton>
      </template>
      <NButton :disabled="BatchRemoveFavourite.isDeleting.value" text type="primary" v-else
        @click="BatchRemoveFavourite.isSetecting.value = true">删除
      </NButton>
    </template>
  </VanNavBar>
  <List :item-height="160" :reloadable="!BatchRemoveFavourite.isSetecting.value"
    @reload="then => { app.user()?.favourite.reload(); app.user()?.favourite.next().then(then) }"
    class="h-[calc(100%-46px)] w-full" :data="app.user()?.favourite.docs.value ?? []" ref="list"
    :is-requesting="isEmpty(app.user()) || !!app.user()?.favourite.isRequesting.value"
    v-slot="{ height, data: { item: comic, index } }" @next="loadNext()"
    :end="isEmpty(app.user()) ? false : (app.user()!.favourite.done.value)">
    <van-swipe-cell class="w-full relative" style="--van-checkbox-duration: 0s;" :style="{ height: `${height}px` }">
      <ComicCard :comic :height
        :disabled="BatchRemoveFavourite.isDeleting.value || BatchRemoveFavourite.isSetecting.value" />
      <div
        @click="BatchRemoveFavourite.isSetecting.value && (BatchRemoveFavourite.list[index] = !BatchRemoveFavourite.list[index])"
        v-if="BatchRemoveFavourite.isDeleting.value || BatchRemoveFavourite.isSetecting.value"
        class="w-full h-full absolute top-0 left-0" :class="[!BatchRemoveFavourite.isSetecting.value && 'hidden']">
        <VanCheckbox :model-value="BatchRemoveFavourite.list[index]" class="absolute bottom-1 right-1"
          v-if="BatchRemoveFavourite.isSetecting.value" />
      </div>
      <template #right>
        <van-button square text="删除" type="danger" class="h-full" @click="comic.favourite()" />
      </template>
    </van-swipe-cell>
  </List>
</template>
