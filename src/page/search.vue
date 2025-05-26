<script setup lang='ts'>
import { ComicStreamWithKeyword, ComicStreamWithAuthor, ComicStreamWithTranslater, ComicStreamWithTag, ComicStreamWithUploader, ComicStreamWithCategories, ComicStreamWithId, ComicStreamI, ComicStreamWithNoop, ProPlusComic, ProComic, ComicStreamWithPicId } from '@/api'
import { shallowRef, onMounted, ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ComicCard from '@/components/comic/comicCard.vue'
import Search from '@/components/search/search.vue'
import { isEmpty, noop, uniqBy } from 'lodash-es'
import config, { FillerTag } from '@/config'
import { searchResult as lastSearchResult, searchListScroolPosition, SearchStreamType } from '@/stores/temp'
import List from '@/components/list.vue'
import { computedWithControl, useTitle, watchOnce } from '@vueuse/core'
import { SearchHistory } from '@/api/plusPlan'
import { searchModeMap, sorterValue } from '@/utils/translater'
import Sorter from '@/components/search/sorter.vue'
import { useAppStore } from '@/stores'
import { toCn } from '@/utils/translater'
import { cloneDeep } from 'lodash-es'
import { createLoadingMessage } from '@/utils/message'
import Popup from '@/components/popup.vue'
import noneSearchTextIcon from '@/assets/images/none-search-text-icon.webp'

const sorter = shallowRef<InstanceType<typeof Sorter>>()
const list = shallowRef<GenericComponentExports<typeof List>>()
const $route = useRoute()
const $router = useRouter()
const searchText = computed(() => decodeURIComponent($route.query.keyword as string ?? ''))
const searchMode = computed(() => ($route.query.mode as SearchMode) ?? 'keyword')
SearchHistory.patch([`${searchModeMap[searchMode.value]}${searchText.value}`])
useTitle(computed(() => `${decodeURIComponent($route.query.keyword as string ?? '')} | 搜索 | bika`))
function createStream(keyword: string, sort: SortType) {
  const storeKey = keyword + "\u1145" + searchMode.value
  if (lastSearchResult.has(storeKey)) return lastSearchResult.get(storeKey)!
  switch (searchMode.value) {
    case 'pid': {
      try {
        var s: SearchStreamType = new ComicStreamWithPicId(Number(keyword), sort)
      } catch {
        var s: SearchStreamType = new ComicStreamWithNoop(keyword, sort)
      }
      break
    }
    case 'id': {
      try {
        $router.force.replace(`/comic/${searchText.value}/info`)
        var s: SearchStreamType = new ComicStreamWithId(keyword, sort)
      } catch {
        var s: SearchStreamType = new ComicStreamWithNoop(keyword, sort)
      }
      break
    }
    case 'keyword': var s: SearchStreamType = new ComicStreamWithKeyword(keyword, sort); break
    case 'uploader': var s: SearchStreamType = new ComicStreamWithUploader(keyword, sort); break
    case 'translater': var s: SearchStreamType = new ComicStreamWithTranslater(keyword, sort); break
    case 'anthor': var s: SearchStreamType = new ComicStreamWithAuthor(keyword, sort); break
    case 'categories': var s: SearchStreamType = new ComicStreamWithCategories(keyword, sort); break
    case 'tag': var s: SearchStreamType = new ComicStreamWithTag(keyword, sort); break
  }
  lastSearchResult.set(storeKey, s)
  return s
}
const comicStream = computedWithControl(() => $route, () => {
  const st = createStream(searchText.value, config.value['bika.search.sort'])
  return st
})
const reload = (text?: string) => {
  comicStream.value.reload(text ?? searchText.value, config.value['bika.search.sort'])
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
const _fiflerTags = ref<FillerTag[]>(cloneDeep(config.value['bika.search.fillerTags']))
watchOnce(() => app.categories, categories => _fiflerTags.value = uniqBy([..._fiflerTags.value, ...categories.map(v => ({ name: v.title, mode: 'auto' as const }))], v => v.name))
const showfifler = shallowRef(false)
const syncFiflerTags = () => config.value['bika.search.fillerTags'] = cloneDeep(_fiflerTags.value)
const cancelWrite_fiflerTags = () => _fiflerTags.value = cloneDeep(config.value['bika.search.fillerTags'])
const listData = computed(() => comicStream.value.docs.value.filter(comic => {
  const tags = (comic instanceof ProPlusComic ? comic.categories.concat(comic.tags) : comic.categories) ?? []
  for (const unshows of config.value['bika.search.fillerTags'].filter(v => v.mode == 'unshow')) if (tags.find(v => v == unshows.name)) return false
  for (const mustshows of config.value['bika.search.fillerTags'].filter(v => v.mode == 'show')) if (!tags.find(v => v == mustshows.name)) return false
  const reg = /(^|[\(（\[\s【])ai[】\)）\]\s]?/ig
  if (!config.value['bika.search.showAIProject'] && (tags.includes('AI作畫') || reg.test(comic.title) || reg.test(comic.author))) return false
  return true
}))

const getMode = (name: string) => _fiflerTags.value.find(v => v.name == name)?.mode ?? 'auto'
const isInUnshows = (name: string) => getMode(name) == 'unshow'
const isInMustshows = (name: string) => getMode(name) == 'show'

const nextSearch = async (then?: VoidFunction) => {
  if (comicStream.value.isRequesting.value) return
  const loadTimes = shallowRef(0)
  const loadingText = computed(() => loadTimes.value > 1 ? `已加载${loadTimes.value}页无结果` : '加载中')
  const loading = createLoadingMessage(loadingText)
  const loadNext = async () => {
    if (comicStream.value.done.value) return
    loadTimes.value++
    const oldLen = listData.value.length
    await comicStream.value.next()
    if (oldLen == listData.value.length) {
      return await loadNext()
    }
  }
  await loading.bind(loadNext())
  if (then) then()
}

const showSearch = shallowRef(true)
watch(() => list.value?.scrollTop, async (scrollTop, old) => {
  if (!scrollTop || !old) return
  if (scrollTop - old > 0) showSearch.value = false
  else showSearch.value = true
}, { immediate: true })

const searchCom = shallowRef<InstanceType<typeof Search>>()
const toSearchInHideMode = async () => {
  showSearch.value = true
  searchCom.value?.searchInstance?.focus()
}
</script>

<template>
  <header class="w-full h-[86px] text-[--van-text-color] duration-200 transition-transform"
    :class="[showSearch ? '!translate-y-0' : '!-translate-y-[54px]']">
    <Search ref="searchCom" :base-text="searchText" :base-mode="searchMode" show-action />
    <!--  -->
    <div class="van-hairline--bottom h-8 w-full relative items-center bg-[--van-background-2] flex *:!text-nowrap">
      <div class="text-sm h-full ml-2 van-haptics-feedback flex justify-start items-center" @click="showfifler = true">
        <van-icon name="filter-o" size="1.5rem"
          :badge="config['bika.search.fillerTags'].filter(v => v.mode != 'auto').length || undefined" />过滤
      </div>
      <div class="text-sm h-full ml-2 van-haptics-feedback flex justify-start items-center" @click="sorter?.show()">
        <van-icon name="sort" size="1.5rem" class="sort-icon" />排序
        <span class="text-[--p-color] text-xs">-{{
          sorterValue.find(v => v.value == config['bika.search.sort'])?.text
        }}</span>
      </div>
      <div class="text-sm h-full ml-2 van-haptics-feedback flex justify-start items-center">
        <VanSwitch v-model="config['bika.search.showAIProject']" size="1rem" />展示AI作品
      </div>
      <VanIcon name="search" class="absolute top-1/2 duration-200 transition-transform right-0 -translate-y-1/2"
        :class="[showSearch ? 'translate-x-full' : '-translate-x-2']" size="25px" color="var(--van-text-color-2)"
        @click="toSearchInHideMode" />
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
      <van-loading class="w-full flex justify-center" size="24px" v-if="isEmpty(tags())">加载中...</van-loading>
      <template v-else>
        <VanTag :type="isInMustshows(tag) ? 'warning' : 'primary'" class="m-1" size="large"
          v-for="tag of tags().map(v => v.title)" :plain="isInUnshows(tag)" @click="() => {
            let obj = _fiflerTags.find(v => v.name == tag)
            if (!obj) _fiflerTags.push({ name: tag, mode: 'auto' })
            obj = _fiflerTags.find(v => v.name == tag)!
            switch (getMode(tag)) {
              case 'auto': return obj.mode = 'unshow'
              case 'unshow': return obj.mode = 'show'
              case 'show': return obj.mode = 'auto'
            }
          }">
          {{ toCn(tag) }}
        </VanTag>
      </template>
    </div>
  </Popup>
  <NResult status="info" title="无搜索" class="h-[80vh] flex items-center flex-col justify-center" description="请输入"
    v-if="isEmpty($route.query.keyword)">
    <template #icon>
      <Image :src="noneSearchTextIcon" />
    </template>
  </NResult>
  <List :itemHeight="160" :data="listData" reloadable @reload="then => reload().then(then)" v-else
    :is-requesting="isNaN(comicStream.pages.value) && comicStream.isRequesting.value" :is-err="comicStream.isErr.value"
    :err-cause="comicStream.errCause.value" retriable @retry="comicStream.retry()"
    v-slot="{ data: { item: comic }, height }" class="duration-200" :end="comicStream.done.value" @next="nextSearch"
    ref="list"
    :class="[showSearch ? 'h-[calc(100vh-86px)] translate-y-0 transition-[height,transform]' : 'h-[calc(100vh-32px)] -translate-y-[54px] transition-[transform]']">
    <ComicCard :comic :height />
  </List>
  <Sorter ref="sorter" @reload="reload()" />
</template>