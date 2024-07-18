<script setup lang='ts'>
import { useAppStore } from '@/stores'
import { chunk, isEmpty } from 'lodash-es'
import { useRoute } from 'vue-router'

const $route = useRoute()
const name = $route.params.name.toString()
const app = useAppStore()
const space = computed(() => app.collections_list.find(v => v.title == name))


import { shallowRef, inject, watch, computed } from 'vue'
import List from '@/components/list.vue'
import { toReactive } from '@vueuse/core'
import symbol from '@/symbol'
const list = shallowRef<GenericComponentExports<typeof List>>()
const shows = toReactive({
  nav: inject(symbol.showNavBar),
  tab: inject(symbol.showTabbar),
})
watch(() => list.value?.scrollTop, async (scrollTop, old) => {
  if ((space.value!.comics.length / 2) * 260 < window.innerHeight) return
  if (!scrollTop || !old) return
  if (scrollTop - old > 0) shows.nav = shows.tab = false
  else shows.nav = shows.tab = true
}, { immediate: true })
</script>

<template>
  <List :item-height="260" :data="chunk(space?.comics, 2)" class="h-full w-full"
    :is-requesting="isEmpty(app.collections_list)" :end="!isEmpty(app.collections_list)"
    v-slot="{ height, data: { item: comics } }" ref="list">
    <div class="flex justify-between mt-1 *:w-[98%] w-[calc(100%-8px)] pl-1" :style="{ height: `${height}px` }">
      <ComicCard v-for="comic of comics" :comic :height type="small" />
    </div>
  </List>
</template>