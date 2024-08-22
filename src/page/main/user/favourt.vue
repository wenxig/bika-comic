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

class BatchRemoveFavourt {
  public static isSetecting = shallowRef(false)
  public static list = shallowReactive<boolean[]>([])
  public static isDeleting = shallowRef(false)
  public static remove = async () => {
    const loading = createLoadingMessage('删除中')
    BatchRemoveFavourt.isDeleting.value = true
    BatchRemoveFavourt.isSetecting.value = false
    try {
      await Promise.all(BatchRemoveFavourt.list.map((v, index) => {
        console.log('batch remove:', v, index, app.user()?.favourite.docs.value[index])
        if (v) return (app.user()?.favourite.docs.value ?? [])[index].favourt({}, false)
      }))
      await app.$reload.me()
      BatchRemoveFavourt.list.splice(0, Infinity)
      loading.success()
    } catch {
      loading.fail()
    }
    BatchRemoveFavourt.isDeleting.value = false
  }
  public static cancel = () => {
    BatchRemoveFavourt.isSetecting.value = false
    BatchRemoveFavourt.isDeleting.value = false
    BatchRemoveFavourt.list.splice(0, Infinity)
  }
  public static selectAll = () => times(app.user()?.favourite.total.value ?? 0, index => BatchRemoveFavourt.list[index] = true)
  public static selectTog = () => times(app.user()?.favourite.total.value ?? 0, index => BatchRemoveFavourt.list[index] = !BatchRemoveFavourt.list[index])
}


const loadNext = async () => {
  const loading = createLoadingMessage()
  await loading.bind(app.user()?.favourite.next())
}
</script>

<template>
  <VanNavBar title="我的收藏" left-text="返回" left-arrow @click-left="$router.back()">
    <template #right>
      <template v-if="BatchRemoveFavourt.isSetecting.value">
        <NButton :disabled="BatchRemoveFavourt.isDeleting.value" text type="primary" class="mr-2"
          @click="BatchRemoveFavourt.remove">确定
        </NButton>
        <NButton :disabled="BatchRemoveFavourt.isDeleting.value" text type="primary" class="mr-2"
          @click="BatchRemoveFavourt.cancel">取消
        </NButton>
        <NButton :disabled="BatchRemoveFavourt.isDeleting.value" text type="primary" class="mr-2"
          @click="BatchRemoveFavourt.selectTog">反转</NButton>
        <NButton :disabled="BatchRemoveFavourt.isDeleting.value" text type="primary"
          @click="BatchRemoveFavourt.selectAll">
          全选</NButton>
      </template>
      <NButton :disabled="BatchRemoveFavourt.isDeleting.value" text type="primary" v-else
        @click="BatchRemoveFavourt.isSetecting.value = true">删除
      </NButton>
    </template>
  </VanNavBar>
  <List :item-height="160" :reloadable="!BatchRemoveFavourt.isSetecting.value"
    @reload="then => { app.user()?.favourite.reload(); app.user()?.favourite.next().then(then) }"
    class="h-[calc(100%-46px)] w-full" :data="app.user()?.favourite.docs.value ?? []" ref="list"
    :is-requesting="isEmpty(app.user()) || !!app.user()?.favourite.isRequesting.value"
    v-slot="{ height, data: { item: comic, index } }" @next="loadNext()"
    :end="isEmpty(app.user()) ? false : (app.user()!.favourite.done.value)">
    <van-swipe-cell class="w-full relative" style="--van-checkbox-duration: 0s;" :style="{ height: `${height}px` }">
      <ComicCard :comic :height
        :disabled="BatchRemoveFavourt.isDeleting.value || BatchRemoveFavourt.isSetecting.value" />
      <div
        @click="BatchRemoveFavourt.isSetecting.value && (BatchRemoveFavourt.list[index] = !BatchRemoveFavourt.list[index])"
        v-if="BatchRemoveFavourt.isDeleting.value || BatchRemoveFavourt.isSetecting.value"
        class="w-full h-full absolute top-0 left-0" :class="[!BatchRemoveFavourt.isSetecting.value && 'hidden']">
        <VanCheckbox :model-value="BatchRemoveFavourt.list[index]" class="absolute bottom-1 right-1"
          v-if="BatchRemoveFavourt.isSetecting.value" />
      </div>
      <template #right>
        <van-button square text="删除" type="danger" class="h-full" @click="comic.favourt()" />
      </template>
    </van-swipe-cell>
  </List>
</template>
