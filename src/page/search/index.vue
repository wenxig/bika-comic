<script setup lang='ts'>
import { ComicStreamWithKeyword, ComicStreamWithAuthor, ComicStreamWithTranslater, ComicStreamWithTag, ComicStreamWithUploader, ComicStreamWithCategories, ComicStreamWithId, ComicStream, ComicStreamWithNoop, ProPlusComic, ProComic } from '@/api'
import { shallowRef, onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ComicCard from '@/components/comic/comicCard.vue'
import Search from '@/components/search/search.vue'
import { isEmpty, noop, uniqBy } from 'lodash-es'
import config, { FillerTag } from '@/config'
import { searchResult as lastSearchResult, searchListScroolPosition } from '@/stores/temp'
import List from '@/components/list.vue'
import { computedWithControl, useTitle, watchOnce } from '@vueuse/core'
import { patchSearchHitory } from '@/api/plusPlan'
import { modeMap, sorterValue } from '@/utils/translater'
import Sorter from '@/components/search/sorter.vue'
import { useAppStore } from '@/stores'
import { toCn } from '@/utils/translater'
import { cloneDeep } from 'lodash-es'
import { createLoadingMessage } from '@/utils/message'
import Popup from '@/components/popup.vue'

const sorter = shallowRef<InstanceType<typeof Sorter>>()
const list = shallowRef<GenericComponentExports<typeof List>>()
const $route = useRoute()
const $router = useRouter()
const searchText = computed(() => decodeURIComponent($route.query.keyword as string ?? ''))
const searchMode = computed(() => ($route.query.mode as SearchMode) ?? 'keyword')
patchSearchHitory([`${modeMap[searchMode.value]}${searchText.value}`])
useTitle(computed(() => `${decodeURIComponent($route.query.keyword as string ?? '')} | 搜索 | bika`))
function createStream(keyword: string, sort: SortType) {
  const storeKey = keyword + "\u1145" + searchMode.value
  if (lastSearchResult.has(storeKey)) return lastSearchResult.get(storeKey)!
  type Stream = ComicStream<ProPlusComic | ProComic>
  switch (searchMode.value) {
    case 'id': {
      try {
        $router.force.replace(`/comic/${searchText.value}/info`)
        var s: Stream = new ComicStreamWithId(keyword, sort)
      } catch {
        var s: Stream = new ComicStreamWithNoop(keyword, sort)
      }
      break
    }
    case 'keyword': var s: Stream = new ComicStreamWithKeyword(keyword, sort); break
    case 'uploader': var s: Stream = new ComicStreamWithUploader(keyword, sort); break
    case 'translater': var s: Stream = new ComicStreamWithTranslater(keyword, sort); break
    case 'anthor': var s: Stream = new ComicStreamWithAuthor(keyword, sort); break
    case 'categories': var s: Stream = new ComicStreamWithCategories(keyword, sort); break
    case 'tag': var s: Stream = new ComicStreamWithTag(keyword, sort); break
  }
  lastSearchResult.set(storeKey, s)
  return s
}
const comicStream = computedWithControl(() => $route, () => {
  const st = createStream(searchText.value, config.value.searchSort)
  if (isEmpty(st.docs.value)) st.next().catch(noop)
  return st
})
const reload = (text?: string) => {
  comicStream.value.reload(text ?? searchText.value, config.value.searchSort)
  return comicStream.value.next()
}

onMounted(() => {
  if (searchListScroolPosition.has(searchText.value)) list.value?.listInstanse?.scrollTo({ top: searchListScroolPosition.get(searchText.value) })
})
const stop = $router.beforeEach(() => {
  searchListScroolPosition.set(searchText.value, list.value?.scrollTop!)
  stop()
})


const app = useAppStore()
const tags = () => app.categories.slice(13)
const _fiflerTags = ref<FillerTag[]>(cloneDeep(config.value.fillerTags))
watchOnce(() => app.categories, categories => _fiflerTags.value = uniqBy([..._fiflerTags.value, ...categories.map(v => ({ name: v.title, mode: 'auto' as const }))], v => v.name))
const showfifler = shallowRef(false)
const syncFiflerTags = () => config.value.fillerTags = cloneDeep(_fiflerTags.value)
const cancelWrite_fiflerTags = () => _fiflerTags.value = cloneDeep(config.value.fillerTags)
const listData = computed(() => comicStream.value.docs.value.filter(comic => {
  const tags = (comic instanceof ProPlusComic ? comic.categories.concat(comic.tags) : comic.categories) ?? []
  for (const unshows of config.value.fillerTags.filter(v => v.mode == 'unshow')) if (tags.find(v => v == unshows.name)) return false
  for (const mustshows of config.value.fillerTags.filter(v => v.mode == 'show')) if (!tags.find(v => v == mustshows.name)) return false
  const reg = /(^|[\(（\[\s【])ai[】\)）\]\s]?/ig
  if (!config.value.showAIProject && (tags.includes('AI作畫') || reg.test(comic.title) || reg.test(comic.author))) return false
  return true
}))

const getMode = (name: string) => _fiflerTags.value.find(v => v.name == name)?.mode ?? 'auto'
const isInUnshows = (name: string) => getMode(name) == 'unshow'
const isInMustshows = (name: string) => getMode(name) == 'show'

const nextSearch = async (then: (() => void) = () => { }) => {
  if (comicStream.value.isRequesting.value) return
  if (isEmpty(comicStream.value.docs.value)) {
    await comicStream.value.next()
    return
  }
  const loading = createLoadingMessage(undefined, undefined, true)
  try {
    await comicStream.value.next()
    await loading.success()
  } catch {
    await loading.fail()
  }
  // then()
}
</script>

<template>
  <header class="w-full h-auto text-[--van-text-color]">
    <Search :base-text="searchText" :base-mode="searchMode" show-action />
    <div class="van-hairline--top-bottom h-8 w-full items-center bg-[--van-background-2] flex *:!text-nowrap">
      <div class="text-sm h-full ml-2 van-haptics-feedback flex justify-start items-center" @click="showfifler = true">
        <van-icon name="filter-o" size="1.5rem" />过滤
      </div>
      <div class="text-sm h-full ml-2 van-haptics-feedback flex justify-start items-center" @click="sorter?.show()">
        <van-icon name="sort" size="1.5rem" class="sort-icon" />排序
        <span class="text-[--p-color] text-xs">-{{ sorterValue.find(v => v.value == config.value.searchSort)?.text
          }}</span>
      </div>
      <div class="text-sm h-full ml-2 van-haptics-feedback flex justify-start items-center">
        <VanSwitch v-model="config.value.showAIProject" size="1rem" />展示AI作品
      </div>
    </div>
  </header>
  <Popup v-model:show="showfifler" position="bottom" class="max-h-[70%] !overflow-x-hidden" closeable round
    @closed="cancelWrite_fiflerTags">
    <div class="flex mt-2 ml-2 h-[calc(var(--van-popup-close-icon-margin)*3)] w-full items-center">
      <VanButton plain @click="showfifler = false">取消</VanButton>
      <VanButton class="!ml-2" type="primary" @click="() => { syncFiflerTags(); showfifler = false }">确定
      </VanButton>
    </div>
    <div class="w-full flex flex-wrap">
      <van-loading class="ml-2" size="24px" v-if="isEmpty(tags())">加载中...</van-loading>
      <template v-else>
        <VanTag :type="isInMustshows(tag.title) ? 'warning' : 'primary'" class="m-1" size="large" v-for="tag of tags()"
          :plain="isInUnshows(tag.title)" @click="() => {
            let obj = _fiflerTags.find(v => v.name == tag.title)
            if (!obj) _fiflerTags.push({ name: tag.title, mode: 'auto' })
            obj = _fiflerTags.find(v => v.name == tag.title)!
            switch (getMode(tag.title)) {
              case 'auto': return obj.mode = 'unshow'
              case 'unshow': return obj.mode = 'show'
              case 'show': return obj.mode = 'auto'
            }
          }">
          {{ toCn(tag.title) }}
        </VanTag>
      </template>
    </div>
  </Popup>
  <NResult status="info" title="未输入搜索字段" description="尝试输入一些吧" v-if="isEmpty($route.query.keyword)"></NResult>
  <List :itemHeight="160" :data="listData" reloadable @reload="then => reload().then(then)" v-else
    :is-requesting="isNaN(comicStream.pages.value) && comicStream.isRequesting.value" class="h-[calc(100vh-86px)]"
    v-slot="{ data: { item: comic }, height }" :end="comicStream.done.value" @next="nextSearch" ref="list">
    <ComicCard :comic :height />
  </List>
  <Sorter ref="sorter" @reload="reload()" />
</template>

<style scoped lang='scss'>
.sort-icon::before {
  font-weight: 100;
}
</style>