<script setup lang='ts'>
import userIcon from '@/assets/images/userIcon.png?url'
import { useAppStore } from '@/stores'
import { computed, shallowRef, watch } from 'vue'
import Card from '@/components/subscribe/card.vue'
import { Subscribe } from '@/api/plusPlan'
import { ProPlusComic } from '@/api'
import { useRoute, useRouter } from 'vue-router'
import { isEmpty } from 'lodash-es'
import { isDark } from '@/config'
import { until } from '@vueuse/core'
const app = useAppStore()
const route = useRoute()
const router = useRouter()
const select = shallowRef(Subscribe.store.subscribes.find(v => v.id == (decodeURI(route.hash.substring(1) as string) ?? '')))
document.title = "订阅 | bika"
const getComics = () => app.yesterdayUpdateComics?.map(v => {
  for (const user of Subscribe.store.subscribes) {
    switch (user.type) {
      case 'translater': {
        if (v.chineseTeam == user.id) return { subscribe: user, comic: v }
        break
      }
      case 'anthor': {
        if (v.author == user.id) return { subscribe: user, comic: v }
        break
      }
      case 'uploader': {
        break
      }
    }
  }
}).filter(v => !!v) as { subscribe: Subscribe, comic: ProPlusComic }[]

const stream = computed(() => select.value ? Subscribe.store.streams.get(select.value) : undefined)
const subscribe = computed(() => Subscribe.store.subscribes.find(v => v == select.value)! as Subscribe)


watch(select, select => {
  if (select) {
    router.force.replace(`/main/subscribe#${encodeURIComponent(select.id)}`)
    if (isEmpty(stream.value?.docs.value)) stream.value?.next()
    return
  }
  router.force.replace(`/main/subscribe`)
})
until(stream).not.toBeUndefined().then(() => stream.value?.next())
const reload = () => {
  stream.value?.reload()
  return stream.value?.next()
}
</script>

<template>
  <div class="flex flex-col w-full h-full overflow-hidden text-[--van-text-color]">
    <div
      class="w-full pt-1 h-[90px] scroller overflow-x-auto overflow-y-hidden whitespace-nowrap flex items-center bg-[--van-background-2]">
      <div @click="select = undefined"
        class="h-full w-[60px] mx-1 inline-flex flex-col text-center rounded-xl p-1 justify-center"
        :class="[{ 'bg-opacity-50 transition-colors': !select, }, !select && (isDark ? 'bg-[--van-background-3]' : 'bg-gray-300')]">
        <VanIcon name="bell" class="h-[60px] w-[60px] rounded-full bg-gray-300" size="50px" color="var(--van-white)" />
        全部
      </div>
      <div v-for="subscribes of Subscribe.store.subscribes" @click="select = subscribes"
        class="h-full min-w-auto mx-1 inline-flex flex-col text-center rounded-xl p-1 justify-center items-center"
        :class="[{ 'bg-opacity-50 transition-colors': select == subscribes }, select == subscribes && (isDark ? 'bg-[--van-background-3]' : 'bg-gray-300')]">
        <Image :src="subscribes.src ?? userIcon" round class="h-[60px] w-[60px]" />
        <span>{{ subscribes.name }}</span>
      </div>
    </div>
    <div class="w-full h-10 van-hairline--top-bottom flex items-center pl-4 font-bold text-lg bg-[--van-background-2]">
      {{ select ? '最近更新' : '今日更新' }}
    </div>
    <List :item-height="200" :data="getComics() ?? []" v-if="!select" class="w-full van-hairline--top"
      :is-err="stream?.isErr.value" :err-cause="stream?.errCause.value" retriable @retry="stream?.retry()"
      :isRequesting="false" reload-box-class="h-[calc(100%-2.5rem-94px)]"
      v-slot="{ height, data: { item: { comic, subscribe } } }">
      <Card :height :comic :subscribe @user-select="select = subscribe" />
    </List>
    <List :item-height="200" :data="stream?.docs.value ?? []" v-else reloadable @reload="ok => reload()?.then(ok)"
      class="w-full van-hairline--top h-[calc(100%-2.5rem-94px)]" :isRequesting="stream?.isRequesting.value ?? true"
      :end="stream?.done.value ?? false" @next="stream?.next()" v-slot="{ height, data: { item: comic } }">
      <Card :height :comic :subscribe="subscribe" @remove="select = undefined" @user-select="select = subscribe.id" />
    </List>
  </div>
</template>

<style scoped lang='scss'>
.scroller::-webkit-scrollbar {
  display: none;
}
</style>