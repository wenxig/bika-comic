<script setup lang='ts'>
import List from '@/components/list.vue'
import { game } from '@/stores/temp'
import { onMounted, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import GameCard from '@/components/game/gameCard.vue'
import { GameStream } from '@/api/game'
const $router = useRouter()
const list = shallowRef<GenericComponentExports<typeof List>>()
onMounted(() => list.value?.listInstanse?.scrollTo({ top: game.scroll }))
game.game ??= new GameStream()
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
  <div class="w-full h-[calc(100%-46px)]">
    <List :data="game.game?.docs.value ?? []" :item-height="160" :end="game.game?.done.value"
      v-slot="{ height, data: { item: game } }" :is-requesting="game.game?.isRequesting.value ?? true" class="h-full"
      @next="game.game?.next()" @reload="async then => {
        game.game?.reload()
        await game.game?.next()
        then()
      }" reloadable ref="list">
      <GameCard :game :height />
    </List>
  </div>
</template>