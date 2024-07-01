<script setup lang='ts'>
import { useAppStore } from '@/stores'
import Image from '@/components/image.vue'
const app = useAppStore()
document.title = '发现 | bika'
</script>

<template>=
  <main class="flex-wrap flex justify-evenly *:text-[--van-text-color] h-full overflow-y-auto">
    <div
      class="w-[7.5rem] h-[9.5rem] bg-[--van-background-2] shadow-md rounded-3xl mb-1 flex flex-col justify-center items-center"
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

<style scoped lang='scss'></style>