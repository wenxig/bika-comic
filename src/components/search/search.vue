<script setup lang='ts'>
import { useAppStore } from '@/stores'
import { computed, shallowRef } from 'vue'
import SearchPop from './searchPop.vue'
import { useRoute, useRouter } from 'vue-router'
import { useScrollParent } from '@vant/use'
import { useLockHtmlScroll } from 'naive-ui/es/_utils'
import {   Subscribe } from '@/api/plusPlan'
import { getComicInfo, searchComicsWithAuthor } from '@/api'
import { SmartAbortController } from '@/utils/requset'
import { createLoadingMessage } from '@/utils/message'
import { noop } from 'lodash-es'
import { SearchInstance } from 'vant'
import SubscribeButton from '@/components/subscribe/sButton.vue'
import { modeMap, useSearchMode } from '@/utils/translater'
import { useZIndex } from '@/utils/layout'
import SearchTag from './searchTag.vue'
const $props = defineProps<{
  baseText?: string
  baseMode?: SearchMode
  showAction?: boolean
  class?: any
}>()
const route = useRoute()
const search = shallowRef<SearchInstance>()
const onlySearchText = computed(() => decodeURIComponent(<string>route.query.keyword))
const app = useAppStore()
const searchText = shallowRef(($props.baseMode && $props.baseText) ? `${modeMap[$props.baseMode]}${$props.baseText}` : '')
const isShowSearchPop = shallowRef(false)
const f = shallowRef<HTMLDivElement>()
const scrollParent = useScrollParent(f)
const showHotTags = () => {
  scrollParent.value?.scroll({ top: 0, behavior: 'instant' })
  isShowSearchPop.value = true
}
const searchMode = useSearchMode(searchText)
const urlText = (str: string) => str.replace(/^[\@\#]+/g, '')
const router = useRouter()
const handleSearch = (value: string) => {
  app.searchHistory.unshift(value)
  router.force.push(`/search?keyword=${encodeURIComponent(urlText(value))}&mode=${searchMode.value}`)
  search.value?.blur()
  isShowSearchPop.value = false
}

useLockHtmlScroll(isShowSearchPop)
const subscribes = computed(() => Subscribe.store.subscribes.find(v => v.id == onlySearchText.value))
const sac = new SmartAbortController()
let dl = noop
const isRequesting = shallowRef(false)
sac.onAbort(() => {
  dl()
  isRequesting.value = false
})
const addSubscribe = async () => {
  sac.abort()
  isRequesting.value = true
  const loading = createLoadingMessage('订阅中')
  dl = loading.destroy
  try {
    switch (searchMode.value) {
      case 'keyword':
      case 'categories':
      case 'tag':
      case 'id': return
      case 'translater':
      case 'anthor': {
        await Subscribe.add([{
          id: onlySearchText.value,
          name: onlySearchText.value,
          type: searchMode.value
        }], { signal: sac.signal })
        break
      }
      case 'uploader': {
        const { docs: [{ _id }] } = await searchComicsWithAuthor(onlySearchText.value)
        const data = await getComicInfo(_id)
        if (!data) break
        const { _creator: { _id: id, avatar } } = data
        await Subscribe.add([{
          id,
          name: onlySearchText.value,
          type: searchMode.value,
          src: avatar.getUrl()
        }], { signal: sac.signal })
        break
      }
    }
    loading.success()
    isRequesting.value = false
  } catch {
    loading.fail()
    isRequesting.value = false
    return
  }
}

const deleteSubscribe = async () => {
  sac.abort()
  isRequesting.value = true
  const loading = createLoadingMessage('取消中')
  dl = loading.destroy
  try {
    switch (searchMode.value) {
      case 'keyword':
      case 'categories':
      case 'tag':
      case 'id': return
      case 'translater':
      case 'anthor': {
        await Subscribe.remove([onlySearchText.value], { signal: sac.signal })
        break
      }
      case 'uploader': {
        const { docs: [{ _id }] } = await searchComicsWithAuthor(onlySearchText.value)
        const data = await getComicInfo(_id)
        if (!data) break
        const { _creator: { _id: id } } = data
        await Subscribe.remove([id], { signal: sac.signal })
        break
      }
    }
    loading.success()
    isRequesting.value = false
  } catch {
    loading.fail()
    isRequesting.value = false
  }
}

defineExpose({
  searchInstance: search
})
const [zIndex] = useZIndex(isShowSearchPop)
</script>

<template>
  <form action="/" @submit.prevent ref="f" :style="{ zIndex }"
    :class="[{ 'fixed top-0 left-0 w-[100vw] z-[1000]': isShowSearchPop }, $props.class]">
    <VanSearch ref="search" :show-action="showAction && !isShowSearchPop" v-model="searchText" placeholder="请输入搜索内容"
      @search="handleSearch(searchText)" @click-left-icon="handleSearch(searchText)" @focus="showHotTags"
      @cancel="$router.back()" autocomplete="off">
      <template #left-icon>
        <div class="inline-flex items-center justify-center h-full translate-y-[1]">
          <VanIcon name="search" size="1.2rem" />
          <SearchTag :text="searchText" />
        </div>
      </template>
      <template #left>
        <SubscribeButton v-if="['anthor', 'translater', 'uploader'].includes(searchMode) && !isShowSearchPop"
          :is-subscribes="!!subscribes" :disabled="isRequesting" @add-subscribe="addSubscribe()"
          @delete-subscribe="deleteSubscribe()" />
      </template>
    </VanSearch>
  </form>
  <SearchPop v-model:show="isShowSearchPop" v-model="searchText" @search="handleSearch(searchText)" :zIndex />

</template>
<style scoped lang='scss'>
.sub-icon::before {
  -webkit-text-stroke: 1px var(--p-color);
}

.icon::before {
  pointer-events: none;
}
</style>