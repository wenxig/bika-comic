<script setup lang='ts'>
import { isDark } from '@/config'
import { useAppStore } from '@/stores'
import { isEmpty } from 'lodash-es'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
const app = useAppStore()
const $route = useRoute()
enum ComicLevel {
  day,
  week,
  month,
}
const mode = computed(() => <keyof typeof ComicLevel>$route.path.substring($route.path.lastIndexOf('/') + 1))
const data = computed(() => app.levelBoard.comics[ComicLevel[mode.value]])

import { shallowRef, inject, watch } from 'vue'
import List from '@/components/list.vue'
import { toReactive } from '@vueuse/core'
import symbol from '@/symbol'
const list = shallowRef<GenericComponentExports<typeof List>>()
const shows = toReactive({
  nav: inject(symbol.showNavBar),
  tab: inject(symbol.showTabbar),
})
watch(() => list.value?.scrollTop, async (scrollTop, old) => {
  if (!scrollTop || !old) return
  if (scrollTop - old > 0) shows.nav = shows.tab = false
  else shows.nav = shows.tab = true
}, { immediate: true })
</script>

<template>
  <List :item-height="120" :data item-resizable class="h-full w-full" :is-requesting="isEmpty(data)"
    v-slot="{ data: { item: comic, index }, height }" ref="list">
    <div class="flex" :style="`min-height: ${height}px;`">
      <div
        :style="[`background-color:rgba(219,54,124,${1 - (index * 0.1)});`, `color: rgb(${isDark ? 255 : (255 / 40) * (40 - (index + 1))},${isDark ? 255 : (255 / 40) * (40 - (index + 1))},${isDark ? 255 : (255 / 40) * (40 - (index + 1))});`]"
        class="flex justify-center items-center text-3xl !w-[10%] van-hairline--top text-white">
        {{ index + 1 }}
      </div>
      <ComicCard :comic :height class="!w-[90%]" />
    </div>
  </List>
</template>

<style scoped lang='scss'>
:deep(* *, *) {
  transition: all 0s !important;
}
</style>