<script setup lang='ts'>
import { useAppStore } from '@/stores'
import { random } from '@/stores/temp'
import { createLoadingMessage } from '@/utils/message'
import { chunk, isEmpty, uniqBy } from 'lodash-es'
import { nextTick, onMounted, shallowRef } from 'vue'
import List from '@/components/list.vue'
import { useRouter } from 'vue-router'
import { RandomComicStream } from '@/api'
const app = useAppStore()
const list = shallowRef<GenericComponentExports<typeof List>>()
const swipe = 50
const $router = useRouter()
const stream = random.stream ?? (random.stream = new RandomComicStream())
const { docs, isRequesting, done } = stream
onMounted(async () => {
  if (!isEmpty(docs.value)) {
    console.log(random.scroll)
    await nextTick()
    list.value!.listInstanse!.scrollTo({ top: random.scroll })
  }
})
if (isEmpty(docs.value)) {
  stream.next()
}
const nextLoad = async () => {
  const loading = createLoadingMessage()
  const stop = $router.beforeEach(() => {
    stop()
    loading.destroy()
  })
  try {
    await stream.next()
    loading.success()
  } catch {
    loading.fail()
  }
  stop()
}
const stop = $router.beforeEach(() => {
  stop()
  random.scroll = list.value?.scrollTop!
})


</script>

<template>
  <List :item-height="260" :data="chunk(docs, 2)" class="h-full w-full" :is-requesting :end="done" reloadable
    @reload="then => { stream.reload(); stream.next().then(then) }" v-slot="{ height, data: { item: comics, index } }"
    @next="nextLoad()" ref="list">
    <div :style="{ height: `${height}px` }" class="w-full mt-1 flex justify-center *:w-[98%]">
      <div v-if="index == 0" class="h-full">
        <div
          class="bg-[--van-background-2] h-[--swipe] flex items-center text-xl font-bold text-[--p-color] rounded-t-lg">
          &nbsp;今日排行榜</div>
        <van-swipe lazy-render class="!rounded-b-lg" :style="{ height: `${height - swipe}px` }" autoplay="3000">
          <van-swipe-item v-for="comic in uniqBy(app.levelBoard?.comics.map(v => v[0]), v => v?._id)"
            class="!rounded-lg h-auto bg-[--van-background-2]" :style="{ height: `${height - swipe}px` }">
            <ComicCard v-if="comic" :comic :height="height - swipe" type="big" class="!rounded-b-lg" />
          </van-swipe-item>
        </van-swipe>
      </div>
      <div class="flex justify-between h-full" v-else>
        <ComicCard v-for="comic of comics" :comic :height type="small" />
      </div>
    </div>
  </List>
</template>
<style scoped lang='scss'>
* {
  --swipe: calc(v-bind(swipe) * 1px);
}
</style>