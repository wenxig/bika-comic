<script setup lang='ts'>
import { useAppStore } from '@/stores'
import { nextTick, provide, ref, shallowRef, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { toReactive, useCycleList } from '@vueuse/core'
import Alert from './alert.vue'
import { getOriginalSearchContent, toCn, useSearchMode } from '@/utils/translater'
import { createLoadingMessage } from '@/utils/message'
import symbol from '@/symbol'
import Image from '@/components/image.vue'
import Popup from '@/components/popup.vue'
import UserInfo from '@/components/user/userInfo.vue'
import SearchTag from '@/components/search/searchTag.vue'
import { isEmpty } from 'lodash-es'
import config from '@/config'
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

const searchMode = useSearchMode(searchText)
const handleSearch = (value: string) => {
  app.searchHistory.unshift(value)
  $router.force.push(`/search?keyword=${encodeURIComponent(getOriginalSearchContent(value))}&mode=${searchMode.value}`)
  isSearching.value = false
}

const selectPage = shallowRef($route.path.split('/')[3])
const showAlert = shallowRef(false)

const beforeChange = async (t: string) => {
  console.log('home top selected name', t)

  const loading = createLoadingMessage()
  isShowNavBar.value = true
  await loading.bind($router.force.replace(`/main/home/${t}`))
  return true
}
const isShowNavBar = shallowRef(true)
provide(symbol.showNavBar, isShowNavBar)
watch(isShowNavBar, showNavBar => {
  baseHeaderSearchHeight.value = (showNavBar ? 54 : 0)
})
const inputEl = shallowRef<HTMLInputElement>()
const toSearchInHideMode = async () => {
  isShowNavBar.value = true
  await nextTick()
  inputEl.value?.focus()
}

const isShowLeftBar = shallowRef(false)
const avatorComp = ref<HTMLDivElement>()
const leftBar = ref<InstanceType<typeof Popup>>()
</script>
<template>
  <Popup v-model:show="isShowLeftBar" ref="leftBar" class="w-[45%] h-full" position="left" useTurlyShow>
    <Transition name="van-fade" :duration="200">
      <div class="pl-[55px] h-[55px]" v-show="isShowLeftBar">
        <UserInfo small class="w-full h-full" :user="app.user()?.data" />
      </div>
    </Transition>
    <VanCellGroup class="mt-4">
      <VanCell @click="$router.force.push('/user/history')" isLink title="历史记录" icon="clock-o" />
      <VanCell @click="$router.force.push('/user/favourite')" isLink title="我的收藏" icon="star-o" />
      <VanCell @click="$router.force.push('/user/image')" isLink title="图片收藏" icon="photo-o" />
      <VanCell @click="$router.force.push('/user/comment')" isLink title="我的评论" icon="chat-o" />
      <VanCell @click="$router.force.push('/brush-comic')" isLink title="刷漫画" class="relative">
        <template #icon>
          <div class="size-(--van-cell-icon-size] mr-[--van-padding-base)"></div>
          <svg class="size-(--van-cell-icon-size) absolute top-1/2 -translate-y-1/2" viewBox="0 0 48 48"
            xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
            <g id="Icon/Social/tiktok-black" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
              <path
                d="M38.0766847,15.8542954 C36.0693906,15.7935177 34.2504839,14.8341149 32.8791434,13.5466056 C32.1316475,12.8317108 31.540171,11.9694126 31.1415066,11.0151329 C30.7426093,10.0603874 30.5453728,9.03391952 30.5619062,8 L24.9731521,8 L24.9731521,28.8295196 C24.9731521,32.3434487 22.8773693,34.4182737 20.2765028,34.4182737 C19.6505623,34.4320127 19.0283477,34.3209362 18.4461858,34.0908659 C17.8640239,33.8612612 17.3337909,33.5175528 16.8862248,33.0797671 C16.4386588,32.6422142 16.0833071,32.1196657 15.8404292,31.5426268 C15.5977841,30.9658208 15.4727358,30.3459348 15.4727358,29.7202272 C15.4727358,29.0940539 15.5977841,28.4746337 15.8404292,27.8978277 C16.0833071,27.3207888 16.4386588,26.7980074 16.8862248,26.3604545 C17.3337909,25.9229017 17.8640239,25.5791933 18.4461858,25.3491229 C19.0283477,25.1192854 19.6505623,25.0084418 20.2765028,25.0219479 C20.7939283,25.0263724 21.3069293,25.1167239 21.794781,25.2902081 L21.794781,19.5985278 C21.2957518,19.4900128 20.7869423,19.436221 20.2765028,19.4380839 C18.2431278,19.4392483 16.2560928,20.0426009 14.5659604,21.1729264 C12.875828,22.303019 11.5587449,23.9090873 10.7814424,25.7878401 C10.003907,27.666593 9.80084889,29.7339663 10.1981162,31.7275214 C10.5953834,33.7217752 11.5748126,35.5530237 13.0129853,36.9904978 C14.4509252,38.4277391 16.2828722,39.4064696 18.277126,39.8028054 C20.2711469,40.1991413 22.3382874,39.9951517 24.2163416,39.2169177 C26.0948616,38.4384508 27.7002312,37.1209021 28.8296253,35.4300711 C29.9592522,33.7397058 30.5619062,31.7522051 30.5619062,29.7188301 L30.5619062,18.8324027 C32.7275484,20.3418321 35.3149087,21.0404263 38.0766847,21.0867664 L38.0766847,15.8542954 Z"
                id="Fill-1" :fill="config['bika.darkMode'] ? '#fff' : '#000'"></path>
            </g>
          </svg>
        </template>
      </VanCell>
    </VanCellGroup>
  </Popup>
  <header :class="[isShowNavBar ? 'translate-y-0' : '-translate-y-full']"
    class="h-[54px] duration-200 transition-transform w-full bg-(--van-background-2) flex items-center relative overflow-hidden *:overflow-hidden">
    <div class="!w-[41px] !h-[41px] ml-1" ref="avatorComp">
      <Teleport to="#popups">
        <Image :src="app.user()?.data.avatar" round v-if="!isSearching" @click="isShowLeftBar = true"
          class="fixed !w-[41px] !h-[41px] ml-1 top-2 duration-200 transition-transform"
          :style="{ zIndex: (leftBar?.zIndex || 1) + 1 }"
          :class="[isShowNavBar ? 'translate-y-0' : '-translate-y-[200%]', leftBar?.turlyShow && 'duration-500 ', isShowLeftBar && 'translate-y-1 scale-[110%] rotate-[360deg]']" />
      </Teleport>
    </div>
    <div class="w-1/2 ml-3 h-[36px]"></div>
    <div :class="[!isSearching ? 'rounded-full w-1/2 ml-3 left-[41px]' : 'rounded-lg w-[calc(100%-18px)] left-1']"
      class="transition-all duration-200 border-solid border absolute border-gray-400 text-gray-400 h-[36px] px-1 flex items-center">
      <VanIcon name="search" color="rgb(156 163 175)" size="1.5rem"
        @click="handleSearch((searchText || cl.state).toString())" />
      <SearchTag :text="searchText" />
      <form action="/" @submit.prevent="handleSearch(searchText)" class="h-full w-full">
        <input type="search" class="h-full w-full border-none bg-transparent input"
          :class="[config['bika.darkMode'] ? 'text-white' : 'text-black']" spellcheck="false"
          @focus="isSearching = true" v-model="searchText" :placeholder="cl.state?.toString()" ref="inputEl" />
        <Transition leave-from-class="translate-x-[0%] opacity-100" leave-active-class="translate-x-[30%] opacity-0"
          leave-to-class="translate-x-[30%] opacity-0" enter-from-class="translate-x-[30%] opacity-0"
          enter-active-class="translate-x-[0%] opacity-100" enter-to-class="translate-x-[0%] opacity-100">
          <VanIcon name="cross"
            class="z-10 absolute h-full right-2 flex items-center top-0 font-bold transition-[transform,opacity]"
            color="#9ca3af" v-if="!isEmpty(searchText)"></VanIcon>
          <div v-else></div>
        </Transition>
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
    :class="[isShowNavBar ? 'translate-y-0' : '-translate-y-[54px]']">
    <VanTabs shrink class="w-full" :active="selectPage" :beforeChange>
      <VanTab title="推荐" name="random" @click="selectPage = 'random'" />
      <VanTab title="排行榜" name="level" @click="selectPage = 'level'" />
      <VanTab title="分区" name="find" @click="selectPage = 'find'" />
      <VanTab v-for="p of app.collections_list" :title="toCn(p.title)" :name="p.title" @click="selectPage = p.title" />
    </VanTabs>
    <VanIcon name="search" class="absolute top-1/2 duration-200 transition-transform right-0 -translate-y-1/2"
      :class="[isShowNavBar ? 'translate-x-full' : '-translate-x-2']" size="25px" color="var(--van-text-color-2)"
      @click="toSearchInHideMode" />
  </div>
  <div class="w-full duration-200 transition-[height,transform]"
    :class="[isShowNavBar ? 'h-[calc(100%-98px)] translate-y-0' : '!h-[calc(100%-44px)] -translate-y-[54px]']">
    <RouterView v-slot="{ Component, route }">
      <component :is="Component" />
    </RouterView>
  </div>
  <Alert v-model="showAlert" />
</template>

<style scoped lang='scss'>
.input::-webkit-search-cancel-button {
  display: none;
}
</style>