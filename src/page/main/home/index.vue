<script setup lang='ts'>
import { useAppStore } from '@/stores'
import { inject, nextTick, provide, shallowRef, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { toReactive, useCycleList } from '@vueuse/core'
import Alert from './alert.vue'
import { toCn, useSearchMode } from '@/utils/translater'
import { createLoadingMessage } from '@/utils/message'
import symbol from '@/symbol'
const app = useAppStore()
const cl = toReactive(useCycleList(() => app.hotTags))
const clId = setInterval(() => {
  cl.next()
}, 4000)
onBeforeRouteLeave(() => {
  clearInterval(clId)
})
document.title = '首页 | bika'
const $router = useRouter()
const $route = useRoute()
const baseHeaderSearchHeight = shallowRef(54)
const searchText = shallowRef('')
const isSearching = shallowRef(false)
const urlText = (str: string) => str.replace(/^[\@\#]+/g, '')

const searchMode = useSearchMode(searchText)
const handleSearch = (value: string) => {
  app.searchHistory.unshift(value)
  $router.force.push(`/search?keyword=${encodeURIComponent(urlText(value))}&mode=${searchMode.value}`)
  isSearching.value = false
}

const selectPage = shallowRef($route.path.substring($route.path.lastIndexOf('/') + 1))
await $router.force.replace(`/main/home/${selectPage.value}`)
const showAlert = shallowRef(false)

const showTabber = inject(symbol.showTabbar)

const beforeChange = async (t: string) => {
  const loading = createLoadingMessage()
  showNavBar.value = showTabber!.value = true
  try {
    await $router.force.replace(`/main/home/${t}`)
    loading.success()
  } catch {
    loading.fail()
  }
  return true
}
const showTabbar = inject(symbol.showTabbar)!
const showNavBar = shallowRef(true)
provide(symbol.showNavBar, showNavBar)
watch(showNavBar, showNavBar => {
  baseHeaderSearchHeight.value = (showNavBar ? 54 : 0)
})

const inputEl = shallowRef<HTMLInputElement>()
const toSearchInHideMode = async () => {
  showNavBar.value = showTabbar.value = true
  await nextTick()
  inputEl.value?.focus()
}
</script>
<template>
  <header :class="[showNavBar ? 'translate-y-0' : '-translate-y-full']"
    class="h-[54px] duration-200 transition-transform w-full bg-[--van-background-2] flex items-center relative overflow-hidden *:overflow-hidden">
    <Image :src="app.user()?.data.avatar" round v-if="!isSearching" @click="$router.force.replace('/main/user')"
      class="!w-[41px] !h-[41px] ml-1" />
    <div class="w-1/2 ml-3 h-[36px]"></div>
    <div :class="[!isSearching ? 'rounded-full w-1/2 ml-3 left-[41px]' : 'rounded-lg w-[calc(100%-18px)] left-1']"
      class="transition-all duration-200 border-solid border absolute border-gray-400 text-gray-400 h-[36px] px-1 flex items-center">
      <VanIcon name="search" color="rgb(156 163 175)" size="1.5rem" @click="handleSearch(searchText || cl.state)" />
      <form action="/" @submit.prevent="handleSearch(searchText)" class="h-full w-full">
        <input type="search" class="h-full w-full border-none bg-transparent text-black" spellcheck="false"
          @blur="showTabbar = true" @focus="isSearching = true; showTabbar = false" v-model="searchText"
          :placeholder="cl.state" ref="inputEl" />
      </form>
    </div>
    <div class="flex justify-evenly w-[calc(50%-63px)]" v-if="!isSearching">
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
      <van-icon name="bullhorn-o" color="rgb(156 163 175)" size="1.8rem" @click="showAlert = true" />
    </div>
    <SearchPop v-model:show="isSearching" v-model="searchText" @search="handleSearch(searchText)" />
  </header>
  <div class="h-[44px] relative duration-200 transition-transform"
    :class="[showNavBar ? 'translate-y-0' : '-translate-y-[54px]']">
    <VanTabs shrink class="w-full" v-model:active="selectPage" :beforeChange>
      <VanTab title="推荐" name="random" />
      <VanTab title="排行榜" name="level" />
      <VanTab title="分区" name="find" />
      <VanTab v-for="p of app.collections_list" :title="toCn(p.title)" :name="p.title" />
    </VanTabs>
    <VanIcon name="search" class="absolute top-1/2 duration-200 transition-transform right-0 -translate-y-1/2"
      :class="[showNavBar ? 'translate-x-full' : '-translate-x-2']" size="25px" color="var(--van-text-color-2)"
      @click="toSearchInHideMode" />
  </div>
  <div class="w-full duration-200 transition-[height,transform]"
    :class="[showNavBar ? 'h-[calc(100%-98px)] translate-y-0' : '!h-[calc(100%-44px)] -translate-y-[54px]']">
    <RouterView />
  </div>
  <Alert v-model="showAlert" />
</template>