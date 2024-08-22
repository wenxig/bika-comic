<script setup lang='ts'>
import { computed, shallowRef } from 'vue'
import Image from '@/components/image.vue'
import { showImagePreview } from '@/utils/image'
import { createLoadingMessage } from '@/utils/message'
import { useTitle, reactiveComputed } from '@vueuse/core'
import { useGameStore } from '@/stores/game'
import { likeGame } from '@/api/game'
import Download from '@/components/game/download.vue'
const gameStore = useGameStore()
const game = computed(() => gameStore.game.game)
const preload = reactiveComputed(() => gameStore.game.preload ?? {})
const title = computed(() => ` ${game.value?.title ?? preload?.title} | bika`)
useTitle(title)

const handleLike = async () => {
  const loading = createLoadingMessage()
  await loading.bind(likeGame(preload?._id))
  gameStore.game.game!.isLiked = !game.value?.isLiked
}

const showDownload = shallowRef(false)
const preview = (index: number) => game.value && showImagePreview(game.value.screenshots.map(v => v.getUrl()), { loop: true, startPosition: index })
</script>

<template>
  <VanRow class="p-1 *:min-h-[8rem] min-h-[8rem]">
    <VanCol span="8" class="max-h-full !flex items-center">
      <Image :src="preload?.icon" class="w-full" fit="cover" previewable />
    </VanCol>
    <VanCol span="15" class="ml-1 flex flex-col *:text-sm">
      <div class="font-bold text-[--van-text-color]">{{ preload?.title }}</div>
      <div class="text-[--van-primary-color]">
        作者：{{ preload?.publisher }}
      </div>
      <template v-if="game">
        <div class="!text-sm text-[--van-text-color-2]">更新：
          <NTime :time="new Date(game.updated_at)" />
        </div>
        <div class="!text-sm text-[--van-text-color-3]">创建：
          <NTime :time="new Date(game.created_at)" />
        </div>
      </template>
    </VanCol>
  </VanRow>
  <VanRow class="van-hairline--bottom pb-1">
    <VanCol span="12">
      <VanButton class="w-full" type="primary" round @click="showDownload = true">
        下载
      </VanButton>
    </VanCol>
    <VanCol span="6" class="justify-center !flex items-center">
      <van-badge :content="game?.likesCount">
        <van-icon name="like" size="30px" color="var(--van-primary-color)" v-if="game && game.isLiked"
          @click="handleLike" />
        <van-icon name="like-o" size="30px" v-else color="var(--van-text-color)" @click="handleLike" />
      </van-badge>
    </VanCol>
    <VanCol span="6" class="justify-center !flex items-center"
      @click="$router.force.push(`/game/${preload?._id}/comments`)">
      <van-badge :content="game?.commentsCount">
        <van-icon name="chat-o" size="30px" color="var(--van-text-color)" />
      </van-badge>
    </VanCol>
  </VanRow>
  <div class="p-2">
    <div class="w-full flex mt-2 justify-center items-center" v-if="!game">
      <van-loading size="24px">加载中...</van-loading>
    </div>
    <van-swipe :autoplay="3000" lazy-render class="!rounded-lg">
      <van-swipe-item v-for="(image, index) in game?.screenshots" :key="index" class="!rounded-lg">
        <Image :src="image" class="!rounded-lg h-[260px] !w-full" fit="contain" @click="preview(index)" />
      </van-swipe-item>
    </van-swipe>
  </div>
  <VanRow v-if="game?.description" class="p-2 text-sm van-hairline--top">
    <div class="text-[--p-color] text-lg w-full">简介</div>
    <Text :text="game.description" />
  </VanRow>
  <VanRow v-if="game?.updateContent" class="p-2 text-sm van-hairline--top">
    <div class="text-[--p-color] text-lg w-full">最近更新</div>
    <Text :text="game.updateContent" />
  </VanRow>
  <Download v-model:show="showDownload" v-if="game" :game />
</template>