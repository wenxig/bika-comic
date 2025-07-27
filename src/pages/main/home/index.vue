<script setup lang='ts'>
import RouterTab from '@/components/routerTab.vue'
import symbol from '@/symbol'
import { shallowRef, provide } from 'vue'

const isShowNavBar = shallowRef(true)
provide(symbol.showNavBar, isShowNavBar)
</script>
<template>
  <header :class="[isShowNavBar ? 'translate-y-0' : '-translate-y-full']"
    class="h-[54px] duration-200 transition-transform w-full bg-(--van-background-2) flex items-center relative overflow-hidden *:overflow-hidden">
    <div class="!w-[41px] !h-[41px] ml-1">
      <Teleport to="#popups">
        <Image round v-if="!false" class="fixed !w-[41px] !h-[41px] ml-1 top-2 duration-200 transition-transform"
          :class="[isShowNavBar ? 'translate-y-0' : '-translate-y-[200%]']" />
      </Teleport>
    </div>
    <div class="w-1/2 ml-3 h-[36px]"></div>
    <div :class="[!false ? 'rounded-full w-1/2 ml-3 left-[41px]' : 'rounded-lg w-[calc(100%-18px)] left-1']"
      class="transition-all duration-200 border-solid border absolute border-gray-400 text-gray-400 h-[36px] px-1 flex items-center">
      <VanIcon name="search" color="rgb(156 163 175)" size="1.5rem" />
      <form action="/" class="h-full w-full">
        <input type="search" class="h-full w-full border-none bg-transparent input" spellcheck="false" />
        <Transition leave-from-class="translate-x-[0%] opacity-100" leave-active-class="translate-x-[30%] opacity-0"
          leave-to-class="translate-x-[30%] opacity-0" enter-from-class="translate-x-[30%] opacity-0"
          enter-active-class="translate-x-[0%] opacity-100" enter-to-class="translate-x-[0%] opacity-100">
          <VanIcon name="cross"
            class="z-10 absolute h-full right-2 flex items-center top-0 font-bold transition-[transform,opacity]"
            color="#9ca3af"></VanIcon>
        </Transition>
      </form>
    </div>
    <div class="flex justify-evenly w-[calc(50%-63px)]" v-if="!false">
      <VanIcon color="rgb(156 163 175)" @click="$router.force.push('/game')">
        <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32"
          class=" w-[1.8rem] h-[1.8rem]">
          <path
            d="M7.51 26a5.48 5.48 0 0 1-1.44-.19A5.6 5.6 0 0 1 2.19 19l2.33-8.84a5.54 5.54 0 0 1 2.59-3.43a5.43 5.43 0 0 1 4.15-.54A5.52 5.52 0 0 1 14.7 9h2.6a5.49 5.49 0 0 1 3.44-2.81a5.43 5.43 0 0 1 4.15.54a5.57 5.57 0 0 1 2.59 3.41L29.81 19a5.6 5.6 0 0 1-3.89 6.83a5.43 5.43 0 0 1-4.15-.54a5.54 5.54 0 0 1-2.59-3.41L19 21h-6l-.23.86a5.54 5.54 0 0 1-2.59 3.41a5.46 5.46 0 0 1-2.67.73zM9.83 8a3.49 3.49 0 0 0-1.72.46a3.6 3.6 0 0 0-1.66 2.19l-2.33 8.84a3.6 3.6 0 0 0 2.48 4.39a3.43 3.43 0 0 0 2.62-.34a3.54 3.54 0 0 0 1.66-2.19L11.5 19h9l.61 2.35a3.58 3.58 0 0 0 1.66 2.19a3.46 3.46 0 0 0 2.63.34a3.58 3.58 0 0 0 2.47-4.39l-2.33-8.84a3.55 3.55 0 0 0-1.65-2.19a3.46 3.46 0 0 0-2.63-.34a3.55 3.55 0 0 0-2.37 2.22l-.24.66h-5.3l-.24-.66a3.56 3.56 0 0 0-2.38-2.22a3.48 3.48 0 0 0-.9-.12z"
            fill="currentColor" />
          <path d="M10 16a2 2 0 1 1 2-2a2 2 0 0 1-2 2zm0-2z" fill="currentColor" />
          <circle cx="22" cy="12" r="1" fill="currentColor" />
          <circle cx="22" cy="16" r="1" fill="currentColor" />
          <circle cx="20" cy="14" r="1" fill="currentColor" />
          <circle cx="24" cy="14" r="1" fill="currentColor" />
        </svg>
      </VanIcon>
      <VanIcon name="bullhorn-o" color="rgb(156 163 175)" size="1.8rem" />
    </div>
  </header>
  <div class="h-[44px] static duration-200 transition-transform"
    :class="[isShowNavBar ? 'translate-y-0' : '-translate-y-[54px]']">
    <RouterTab router-base="/main/home" :items="[{
      title: '推荐',
      name: 'random'
    }, {
      title: '排行榜',
      name: 'level'
    }, {
      title: '分区',
      name: 'find'
    }]" />
    <VanIcon name="search" class="absolute top-1/2 duration-200 transition-transform right-0 -translate-y-1/2"
      :class="[isShowNavBar ? 'translate-x-full' : '-translate-x-2']" size="25px" color="var(--van-text-color-2)" />
  </div>
  <div class="w-full duration-200 transition-[height,transform]"
    :class="[isShowNavBar ? 'h-[calc(100%-98px)] translate-y-0' : '!h-[calc(100%-44px)] -translate-y-[54px]']">
    <RouterView v-slot="{ Component }">
      <component :is="Component" />
    </RouterView>
  </div>
</template>

<style scoped>
.input::-webkit-search-cancel-button {
  display: none;
}
</style>