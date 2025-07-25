<script setup lang='ts'>
import { random } from '@/stores/temp'
import { createLoadingMessage } from '@/utils/message'
import { chunk, isEmpty } from 'lodash-es'
import { inject, nextTick, onMounted, shallowRef, watch } from 'vue'
import List from '@/components/list.vue'
import { useRouter } from 'vue-router'
import symbol from '@/symbol'
import { ComponentExposed } from 'vue-component-type-helpers'
import { createRandomComicStream } from '@/api/bika/api/search'
import ListStream from '@/components/listStream.vue'
const list = shallowRef<ComponentExposed<typeof List>>()
const useMainPageLevelComicShows = () => {
  // const app = useAppStore()
  // const comicBoard = reactiveComputed(() => app.levelBoard.comics)
  // return reactiveComputed(() => uniqBy(flatten(comicBoard.map(v => v.filter((_v, i) => i <= 2).map(comic => ({
  //   comic,
  //   level: comicBoard.map(v => v.findIndex(v => v._id == comic._id))
  // })))), v => v.comic._id))
  return []
}
const swipe = 50
const $router = useRouter()
const stream = random.stream ??= createRandomComicStream()
onMounted(async () => {
  if (!isEmpty(stream._data)) {
    await nextTick()
    list.value?.listInstance?.scrollTo({ top: random.scroll })
  }
  if (isEmpty(stream._data)) {
    stream.next()
  }
})
const nextLoad = async () => {
  const loading = createLoadingMessage()
  const stop = $router.beforeEach(() => {
    stop()
    loading.destroy()
  })
  await loading.bind(stream.next(), false)
  stop()
}
const stop = $router.beforeEach(() => {
  stop()
  random.scroll = list.value?.scrollTop!
})

const showNavBar = inject(symbol.showNavBar)!
watch(() => list.value?.scrollTop, async (scrollTop, old) => {
  if (!scrollTop || !old) return
  if (scrollTop - old > 0) showNavBar.value = false
  else showNavBar.value = true
}, { immediate: true })

const topComics = useMainPageLevelComicShows()
</script>

<template>
  <ListStream :item-height="260" :stream v-slot="{ data: { item: comic } }">
    <div :style="{ height: `${height}px` }" class="w-full mt-1 flex justify-center *:w-[98%]">
      <div class="flex justify-between h-full">
        <ComicCard v-for="comic of comics" :comic :height type="small" />
      </div>
    </div>
  </ListStream>
</template>
<style scoped>
.levelTag {
  @apply first:rounded-tl-lg last:rounded-br-lg last:border-none;
}
</style>