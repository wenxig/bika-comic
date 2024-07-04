<script setup lang='ts'>
import { WatchHistory, } from '@/api/plusPlan'
import { shallowRef } from 'vue'
import { useAppStore } from '@/stores'
import { values, sortBy } from 'lodash-es'
import config from '@/config'
import List from '@/components/list.vue'
import { SmartAbortController } from '@/utils/requset'
import { onBeforeRouteLeave } from 'vue-router'
const app = useAppStore()
const isRefreshing = shallowRef(false)
const sca = new SmartAbortController()
const resyncHistory = () => new Promise<Record<string, WatchHistory>>((ok, fail) => {
  if (config.value['bika.plusPlan']) {
    isRefreshing.value = true
    sca.abort()
    app.$reload.readHistory({ signal: sca.signal })
      .then(() => {
        ok(app.readHistory)
      }).catch((err) => {
        fail(err)
      }).finally(() => {
        isRefreshing.value = false
      })
  } else {
    isRefreshing.value = false
    ok(app.readHistory)
  }
})
onBeforeRouteLeave(() => sca.abort())
</script>

<template>
  <VanNavBar title="历史记录" left-text="返回" left-arrow @click-left="$router.back()" />
  <List :item-height="160" reloadable @reload="then => resyncHistory().then(then)" class="h-[calc(100%-46px)]"
    :data="isRefreshing ? [] : sortBy(values(app.readHistory), i => i[3]).toReversed().filter(Boolean)"
    :is-requesting="isRefreshing" v-slot="{ height, data: { item } }">
    <ComicCard :comic="item[1]" :height />
  </List>
</template>