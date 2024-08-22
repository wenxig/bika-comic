<script setup lang='ts'>
import { random } from '@/stores/temp'
import { createLoadingMessage } from '@/utils/message'
import { chunk, isEmpty } from 'lodash-es'
import { inject, nextTick, onMounted, shallowRef, watch } from 'vue'
import List from '@/components/list.vue'
const list = shallowRef<GenericComponentExports<typeof List>>()
import { useRouter } from 'vue-router'
import { RandomComicStream } from '@/api'
import symbol from '@/symbol'
import { useMainPageLevelComicShows } from '@/utils/requset'
const swipe = 50
const $router = useRouter()
const stream = random.stream ??= new RandomComicStream()
const { docs, isRequesting, done, isErr, errCause } = stream
onMounted(async () => {
  if (!isEmpty(docs.value)) {
    console.log(random.scroll)
    await nextTick()
    list.value?.listInstanse?.scrollTo({ top: random.scroll })
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
  <List :item-height="260" :data="chunk(docs, 2)" class="h-full w-full" :is-requesting :end="done" reloadable
    @reload="then => { stream.reload(); stream.next().then(then) }" v-slot="{ height, data: { item: comics, index } }"
    @next="nextLoad()" @retry="stream.retry()" ref="list" :isErr :errCause retriable>
    <div :style="{ height: `${height}px` }" class="w-full mt-1 flex justify-center *:w-[98%]">
      <div v-if="index == 0" class="h-full">
        <div
          class="bg-[--van-background-2] h-[--swipe] flex items-center text-xl font-bold text-[--p-color] rounded-t-lg">
          &nbsp;今日排行榜</div>
        <van-swipe lazy-render class="!rounded-b-lg bg-[--van-background-2]" :style="{ height: `${height - swipe}px` }"
          autoplay="3000">
          <van-swipe-item v-for="{ comic, level } of topComics" class="!rounded-lg h-auto bg-[--van-background-2]"
            :style="{ height: `${height - swipe}px` }">
            <ComicCard v-if="comic" :comic :height="height - swipe" type="big" class="!rounded-b-lg">
              <div
                class="absolute bottom-[-2%] right-[-3%] flex *:border-r *:border-[0px] *:bg-[--p-color] *:text-white *:text-xs *:px-1 *:opacity-70 *:border-white *:border-solid">
                <div v-if="level[0] + 1" class="levelTag">
                  日榜第{{ level[0] + 1 }}
                </div>
                <div v-if="level[1] + 1" class="levelTag">
                  周榜第{{ level[1] + 1 }}
                </div>
                <div v-if="level[2] + 1" class="levelTag">
                  月榜第{{ level[2] + 1 }}
                </div>
              </div>
            </ComicCard>
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

.levelTag {
  @apply first:rounded-tl-lg last:rounded-br-lg last:border-none;
}
</style>