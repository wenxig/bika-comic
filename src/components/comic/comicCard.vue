<script setup lang='ts'>
import { Comic, ProComic, ProPlusComic, ProPlusMaxComic } from '@/api'
import Image from '../image.vue'
import { spiltAnthors, toCn } from '@/utils/translater'
import { useElementSize } from '@vueuse/core'
import { shallowRef } from 'vue'
import { max, isEmpty } from 'lodash-es'
import { useComicStore } from '@/stores/comic'
withDefaults(defineProps<{
  comic: ProComic | ProPlusComic | ProPlusMaxComic
  height: number | string
  resizeable?: boolean
  disabled?: boolean
  type?: 'default' | 'big' | 'small'
  mode?: 'push' | 'replace'
}>(), {
  mode: 'push',
  type: 'default'
})
const $emit = defineEmits<{
  setup: []
}>()
$emit('setup')
const comicStore = useComicStore()
const MAX_TAGS = 5
const info = shallowRef<HTMLDivElement>()
const { height: contentHeight } = useElementSize(info)

</script>

<template>
  <button v-if="(comic instanceof Comic)"
    class="overflow-hidden w-full van-hairline--bottom flex bg-center bg-[--van-background-2] text-[--van-text-color] border-none relative active:bg-gray p-0 items-start"
    :style="[
      { [resizeable ? 'minHeight' : 'height']: `${((resizeable ? max([contentHeight, height]) : height) ?? 0)}px` },
    ]"
    :class="[{ 'van-haptics-feedback': !disabled, 'shadow-sm': type == 'big' }, { '!w-[calc(50%-2px)] rounded-lg shadow-sm !block': type == 'small' }]"
    @click=" comic instanceof ProPlusMaxComic ? comicStore.$setupComic(comic) : comicStore.$setupPreload(comic); $router.force[mode](`/comic/${comic._id}/info`)"
    :disabled>
    <Image :src="comic.thumb" v-if="type == 'big'" class="blur-lg absolute top-0 left-0 w-full h-full" fit="cover" />
    <Image :src="comic.thumb" v-if="type != 'small'" class="ml-[2%] w-[30%] h-full relative z-10" fit="contain" />
    <div class="w-full h-[80%] flex items-center relative" v-else>
      <Image :src="comic.thumb" class="rounded-t-lg h-full w-full" fit="cover" />
      <div
        class="absolute w-full h-6 text-white bg-[linear-gradient(transparent,rgba(0,0,0,0.3))] bottom-0 flex items-end justify-start">
        <span class="mr-1 !text-sm">
          <VanIcon name="eye-o" size="1rem" />
          {{ comic.totalViews }}
        </span>
        <span class=" !text-sm">
          <VanIcon name="like-o" size="1rem" />
          {{ comic.totalLikes }}
        </span>
      </div>
    </div>
    <div class="w-full h-[20%] overflow-hidden flex flex-col text-[--van-text-color]" v-if="type == 'small'">
      <div class="flex flex-nowrap">
        <span class="text-[--p-color]" v-if="(comic instanceof ProComic)">[{{ comic.pagesCount }}p]</span>
        <span class="font-bold van-ellipsis">{{ comic.title }}</span>
      </div>
      <div class=" my-1 w-full h-auto flex-nowrap flex">
        <van-tag type="primary" v-for="tag of comic.categories.slice(0, 3)"
          class="mr-1 text-nowrap">{{ toCn(tag) }}</van-tag>
        <van-tag type="primary" plain v-if="comic.categories.length > 3" class="mr-1 text-nowrap">...</van-tag>
      </div>
    </div>
    <div class="w-[62%] min-h-[98%] *:text-sm flex absolute right-[2%] flex-col *:text-justify" ref="info" v-else>
      <span class="font-bold" :class="[!resizeable && 'van-ellipsis']">
        <span v-if="(comic instanceof ProComic)" class="text-[--p-color]">[{{ comic.pagesCount }}p]</span>
        <span v-if="(comic instanceof ProComic)" class="text-[--p-color]">[{{ comic.epsCount }}ep]</span>
        {{ comic.title }}
      </span>
      <div class="text-[--van-primary-color] flex flex-wrap *:text-nowrap" :class="[!resizeable && 'van-ellipsis']">
        <span>作者：</span>
        <span v-for=" author of spiltAnthors(comic?.author)" class="mr-2 van-haptics-feedback underline"
          @click="comic && $router.force[mode](`/search?keyword=${author}&mode=anthor`)">{{ author }}</span>
      </div>
      <span class="text-[--van-text-color-2]" :class="[!resizeable && 'van-ellipsis']"
        v-if="(comic instanceof ProPlusComic) && !isEmpty(comic.chineseTeam)">
        汉化：{{ comic.chineseTeam }}
      </span>
      <div class="my-1 w-full h-auto">
        <van-tag type="primary" v-for="tag of comic.categories.slice(0, MAX_TAGS)"
          class="mr-1 *:!text-nowrap !text-nowrap">{{ toCn(tag) }}</van-tag>
        <van-tag type="primary" plain v-if="comic.categories.length > MAX_TAGS"
          class="mr-1 *:!text-nowrap !text-nowrap">...</van-tag>
      </div>
      <div class="w-full flex">
        <span class="flex items-center mr-2 " v-if="comic.totalViews">
          <VanIcon name="eye-o" size="16px" />
          <span class="ml-1 text-[13px]">{{ comic.totalViews }}</span>
        </span>
        <span class="flex items-center" v-if="comic.likesCount">
          <VanIcon name="like-o" size="16px" />
          <span class="ml-1 text-[13px]">{{ comic.likesCount }}</span>
        </span>
      </div>
      <slot />
    </div>
  </button>
</template>