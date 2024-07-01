<script setup lang='ts'>
import { Game, PlusGame } from '@/api/game'
import { useGameStore } from '@/stores/game'
const gameStore = useGameStore()
defineProps<{
  height: number,
  game: Game | PlusGame,
  disabled?: boolean
}>()
</script>

<template>
  <button :style="{ height: `${height}px` }" @click="() => {
    gameStore.$setupPreload(game)
    $router.force.push(`/game/${game._id}/info`)
  }" :disabled
    class="w-full van-hairline--bottom bg-[--van-background-2] van-haptics-feedback text-[--van-text-color] flex border-none relative active:bg-gray items-start">
    <Image :src="game.icon" class="ml-[2%] w-[30%] h-full" fit="contain" />
    <div class="w-[62%] min-h-[98%] *:text-sm flex absolute right-[2%] flex-col *:text-justify">
      <span class="font-bold van-ellipsis">
        <span class="text-[--p-color]" v-if="game.suggest">[推荐]</span>
        {{ game.title }}</span>
      <span class="text-[--van-primary-color] van-ellipsis">作者：{{ game.publisher }}</span>
      <div class=" my-1 w-full h-auto">
        <van-tag type="primary" class="mr-1 text-nowrap" v-if="game.android">
          <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1024 1024"
            class="w-4">
            <path
              d="M270.1 741.7c0 23.4 19.1 42.5 42.6 42.5h48.7v120.4c0 30.5 24.5 55.4 54.6 55.4c30.2 0 54.6-24.8 54.6-55.4V784.1h85v120.4c0 30.5 24.5 55.4 54.6 55.4c30.2 0 54.6-24.8 54.6-55.4V784.1h48.7c23.5 0 42.6-19.1 42.6-42.5V346.4h-486v395.3zm357.1-600.1l44.9-65c2.6-3.8 2-8.9-1.5-11.4c-3.5-2.4-8.5-1.2-11.1 2.6l-46.6 67.6c-30.7-12.1-64.9-18.8-100.8-18.8c-35.9 0-70.1 6.7-100.8 18.8l-46.6-67.5c-2.6-3.8-7.6-5.1-11.1-2.6c-3.5 2.4-4.1 7.4-1.5 11.4l44.9 65c-71.4 33.2-121.4 96.1-127.8 169.6h486c-6.6-73.6-56.7-136.5-128-169.7zM409.5 244.1a26.9 26.9 0 1 1 26.9-26.9a26.97 26.97 0 0 1-26.9 26.9zm208.4 0a26.9 26.9 0 1 1 26.9-26.9a26.97 26.97 0 0 1-26.9 26.9zm223.4 100.7c-30.2 0-54.6 24.8-54.6 55.4v216.4c0 30.5 24.5 55.4 54.6 55.4c30.2 0 54.6-24.8 54.6-55.4V400.1c.1-30.6-24.3-55.3-54.6-55.3zm-658.6 0c-30.2 0-54.6 24.8-54.6 55.4v216.4c0 30.5 24.5 55.4 54.6 55.4c30.2 0 54.6-24.8 54.6-55.4V400.1c0-30.6-24.5-55.3-54.6-55.3z"
              fill="currentColor"></path>
          </svg>
          <span>android</span>
        </van-tag>
        <van-tag type="primary" class="mr-1 text-nowrap" v-if="game.ios">
          <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24"
            class="w-4">
            <path
              d="M17.05 20.28c-.98.95-2.05.8-3.08.35c-1.09-.46-2.09-.48-3.24 0c-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8c1.18-.24 2.31-.93 3.57-.84c1.51.12 2.65.72 3.4 1.8c-3.12 1.87-2.38 5.98.48 7.13c-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25c.29 2.58-2.34 4.5-3.74 4.25z"
              fill="currentColor"></path>
          </svg>
          <span>ios</span>
        </van-tag>
        <van-tag type="primary" class="mr-1 text-nowrap" v-if="game.adult">
          <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24"
            class="w-4">
            <g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="7" r="4"></circle>
              <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"></path>
            </g>
          </svg>
          <span>18+</span>
        </van-tag>
      </div>
    </div>
  </button>

</template>