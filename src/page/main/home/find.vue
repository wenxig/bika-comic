<script setup lang='ts'>
import { useAppStore } from '@/stores'
import Image from '@/components/image.vue'
import { inject, ref, watch } from 'vue'
import { toReactive, useScroll } from '@vueuse/core'
import symbol from '@/symbol'
const app = useAppStore()
document.title = '发现 | bika'

const list = ref<HTMLDivElement>()
const shows = toReactive({
  nav: inject(symbol.showNavBar),
  tab: inject(symbol.showTabbar),
})
const { isScrolling, directions } = useScroll(list)
watch(isScrolling, async isScrolling => {
  if (!isScrolling) return
  if (directions.bottom) shows.nav = shows.tab = false
  else shows.nav = shows.tab = true
}, { immediate: true })
</script>

<template>
  <main class="flex-wrap flex justify-evenly *:text-[--van-text-color] h-full overflow-y-auto" ref="list">
    <div
      class="w-[7.5rem] h-[9.5rem] bg-[--van-background-2] shadow-md rounded-3xl my-1 flex flex-col justify-center items-center"
      v-for="categorie of app.categories.filter(v => !v.link)"
      @click="$router.force.push(`/search?keyword=${encodeURIComponent(categorie.title)}&mode=categories`)">
      <div class="w-[7rem] h-[7rem]">
        <Image :src="categorie.thumb" fit="cover" class="w-full h-full rounded-lg" />
      </div>
      <span class="flex items-center justify-center">{{ categorie.title }}</span>
    </div>
    <van-back-top bottom="calc(var(--van-tabbar-height) + 1rem)" />
  </main>
</template>