<script setup lang='ts'>
import List from '@/components/list.vue'
import { game } from '@/stores/temp'
import { onMounted, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import GameCard from '@/components/game/gameCard.vue'
const $router = useRouter()
const list = shallowRef<GenericComponentExports<typeof List>>()
onMounted(() => list.value?.listInstanse?.scrollTo({ top: game.scroll }))
const stop = $router.beforeEach(() => {
  stop()
  game.scroll = list.value?.scrollTop!
})
if (game.game.docs.value.length == 0) {
  game.game.next()
}
</script>

<template>
  <van-nav-bar title="游戏区" left-text="返回" left-arrow @click-left="$router.back()" />
  <header class="w-full h-auto text-[--van-text-color]">
    <div class="van-hairline--top-bottom h-8 w-full items-center bg-[--van-background-2] flex">
      <div class="text-sm h-full ml-2 van-haptics-feedback flex justify-start items-center">
        <del><van-icon name="filter-o" size="1.5rem" />过滤</del>
      </div>
      <van-loading class="ml-2" size="24px"
        v-if="!isNaN(game.game.pages.value) && game.game.isRequesting.value">加载中...</van-loading>
    </div>
  </header>
  <div class="w-full h-[calc(100%-32px-46px)]">
    <List :data="game.game.docs.value" :item-height="160" :end="game.game.done.value"
      v-slot="{ height, data: { item: game } }" :is-requesting="game.game.isRequesting.value" class="h-full"
      @next="game.game.next()" @reload="async then => {
        game.game.reload()
        await game.game.next()
        then()
      }" reloadable ref="list">
      <GameCard :game :height />
    </List>
  </div>
</template>