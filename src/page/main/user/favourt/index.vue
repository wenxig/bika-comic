<script setup lang='ts'>
import { useAppStore } from '@/stores'
import { isEmpty } from 'lodash-es'
const app = useAppStore()

import List from '@/components/list.vue'
import { userPageScroll } from '@/stores/temp'
import { onMounted, shallowRef } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
const list = shallowRef<GenericComponentExports<typeof List>>()
onMounted(() => {
  list.value?.listInstanse?.scrollTo({ top: userPageScroll.image })
})
onBeforeRouteLeave(() => {
  if (list.value?.scrollTop) userPageScroll.image = list.value?.scrollTop
})
</script>

<template>
  <VanNavBar title="我的收藏" left-text="返回" left-arrow @click-left="$router.back()" />
  <List :item-height="160" reloadable @reload="then => app.$reload.me().then(then)" class="h-[calc(100%-46px)] w-full"
    :data="app.user?.favourite ?? []" ref="list" :is-requesting="isEmpty(app.user)" v-slot="{ height, data: { item: comic } }">
    <ComicCard :comic :height />
  </List>
</template>