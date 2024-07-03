<script setup lang='ts'>
import { searchComicsWithTag, searchComics, ProPlusComic, searchComicsWithAuthor, searchComicsWithTranslater, getComicInfo, searchComicsWithUploader, searchComicsWithCategories, ProComic } from '@/api'
import { useAppStore } from '@/stores'
import { isBoolean, isEmpty, noop } from 'lodash-es'
import { watchDebounced } from '@vueuse/core'
import { computed, shallowRef, watch } from 'vue'
import { SmartAbortController } from '@/utils/requset'
import { getSearchHitory } from '@/api/plusPlan'
import { modeMap } from '@/utils/translater'
import { useZIndex } from '@/utils/layout'
const inputText = defineModel<string>({ required: true })
const searchMode = computed<SearchMode>(() => {
  if (inputText.value.startsWith(modeMap.uploader)) return 'uploader'
  if (inputText.value.startsWith(modeMap.translater)) return 'translater'
  if (inputText.value.startsWith(modeMap.anthor)) return 'anthor'
  if (inputText.value.startsWith(modeMap.id)) return 'id'
  if (inputText.value.startsWith(modeMap.tag)) return 'tag'
  if (inputText.value.startsWith(modeMap.categories)) return 'categories'
  return 'keyword'
})
const props = defineProps<{
  show: boolean
}>()
defineEmits<{
  search: []
}>()
type SearchRes = ProComic[] | ProPlusComic[]
const app = useAppStore()
const thinkList = shallowRef<SearchRes | null>(null)
watch(inputText, () => thinkList.value = null)
const keyOfStopRequest = new AbortController()

const sac = new SmartAbortController()
async function request(inputText: string) {
  sac.abort()
  try {
    switch (searchMode.value) {
      case 'uploader': {
        var req: SearchRes = (await searchComicsWithUploader(inputText!.substring(3), undefined, undefined, { signal: sac.signal })).docs
        break
      }
      case 'translater': {
        var req: SearchRes = (await searchComicsWithTranslater(inputText!.substring(2), undefined, undefined, { signal: sac.signal })).docs
        break
      }
      case 'anthor': {
        var req: SearchRes = (await searchComicsWithAuthor(inputText!.substring(1), undefined, undefined, { signal: sac.signal })).docs
        break
      }
      case 'id': {
        const value = await getComicInfo(inputText!.substring(3), { signal: sac.signal })
        if (value) var req: SearchRes = [new ProPlusComic(<any>value)]
        else var req: SearchRes = []
        break
      }
      case 'categories': {
        var req: SearchRes = (await searchComicsWithCategories(inputText!.substring(1), undefined, undefined, { signal: sac.signal })).docs
        break
      }
      case 'tag': {
        var req: SearchRes = (await searchComicsWithTag(inputText!.substring(2), undefined, undefined, { signal: sac.signal })).docs
        break
      }
      default: {
        var req: SearchRes = (await searchComics(inputText!)).docs
        break
      }
    }
    return req
  } catch {
    return []
  }
}
watchDebounced(inputText, async (inputText, ov) => {
  if (ov == inputText) return
  keyOfStopRequest.abort()
  try {
    const req = await request(inputText!)
    thinkList.value = req.slice(0, 7)
  } catch { }
}, { debounce: 500, maxWait: 100000 })
if (inputText.value) request(inputText.value!).then(v => thinkList.value = v.slice(0, 7)).catch(noop)


const searchHistorySac = new SmartAbortController()
watch(() => props.show, show => {
  if (!show) return
  searchHistorySac.abort()
  getSearchHitory({ signal: searchHistorySac.signal }).then(v => !isBoolean(v) && (app.searchHistory = v))
}, { immediate: true })


const [zIndex] = useZIndex(() => props.show)
</script>

<template>
  <div :class="{ '!max-h-[60vh] h-auto !pt-1 !pb-4': show }" :style="{ zIndex }"
    class="w-full flex flex-wrap justify-evenly transition-all overflow-y-auto h-0 overflow-hidden bg-[--van-background-2] rounded-b-3xl pb-0 pt-0 fixed top-[54px]">
    <template v-if="isEmpty(inputText)">
      <template v-if="!isEmpty(app.searchHistory)">
        <span class="text-xl text-[--van-primary-color] font-bold w-full pl-3 van-hairline--top">历史搜索</span>
        <div class="w-full h-auto flex flex-wrap pl-1 mb-1">
          <van-tag type="primary" v-for="(tag, index) of app.searchHistory.toReversed().slice(0, 12)" size="large"
            class="m-1 text-nowrap van-haptics-feedback" plain :key="index"
            @click="() => { inputText = tag; $emit('search') }">{{ tag }}</van-tag>
        </div>
      </template>
      <span class="text-xl text-[--van-primary-color] font-bold w-full pl-3 van-hairline--top">热词</span>
      <van-tag type="primary" v-for="tag of app.hotTags" size="large" class="m-1 text-nowrap van-haptics-feedback"
        @click="() => { inputText = `##${tag}`; $emit('search') }">{{ tag }}</van-tag>
    </template>
    <VanList v-else class="w-full">
      <template v-if="thinkList == null">
        <div class="w-full flex justify-center items-center">
          <van-loading size="24px">加载中...</van-loading>
        </div>
      </template>
      <template v-else-if="!isEmpty(thinkList)">
        <van-cell v-for="think of thinkList" :title="think.title" :value="think.author" @click="() => {
          inputText = think.title
          $emit('search')
        }" class="van-haptics-feedback w-full" />
      </template>
      <div v-else>
        <NEmpty description="无结果" class="w-full my-1" />
      </div>
    </VanList>
  </div>
</template>
