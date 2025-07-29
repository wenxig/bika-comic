<script setup lang='ts'>
import Image from '../image.vue'
import { toCn } from '@/utils/translator'
import { useElementSize } from '@vueuse/core'
import { shallowRef } from 'vue'
import { max, isEmpty } from 'lodash-es'
import symbol from '@/symbol'
import { CommonComic, FullComic, LessComic } from '@/api/bika/comic'
import { useRouter } from 'vue-router'
import { useComicStore } from '@/stores/comic'
import { DrawOutlined } from '@vicons/material'
const $props = withDefaults(defineProps<{
  comic?: CommonComic | LessComic | FullComic
  height: number | string
  resizable?: boolean
  disabled?: boolean
  type?: 'default' | 'big' | 'small'
  mode?: 'push' | 'replace'
  hideEpInfo?: boolean
  hideViewNumber?: boolean
}>(), {
  mode: 'push',
  type: 'default'
})
const info = shallowRef<HTMLDivElement>()
const { height: contentHeight } = useElementSize(info)
defineSlots<{
  cover?(arg: { src: string }): any
  default(): any
}>()
const $emit = defineEmits<{
  click: []
}>()
const $router = useRouter()
const comicStore = useComicStore()
const handleClick = () => {
  if (!$props.comic) return
  $emit('click')
  comicStore.$load($props.comic._id, $props.comic)
  $router.force[$props.mode](`/comic/${$props.comic._id}`)
}
</script>

<template>
  <button
    class="overflow-hidden w-full van-hairline--top-bottom flex bg-center bg-(--van-background-2) text-(--van-text-color) border-none relative active:bg-gray p-0 items-center"
    :style="{ [resizable ? 'minHeight' : 'height']: `${((resizable ? max([contentHeight, height]) : height) ?? 0)}px` }"
    :class="[{ 'van-haptics-feedback': !disabled }, { '!w-[calc(50%-2px)] rounded-lg !block': type == 'small' }]"
    @click="handleClick" :disabled v-if="comic">
    <Image :src="comic.$thumb" v-if="type == 'big' && !$slots.cover" class="blur-lg absolute top-0 left-0 w-full h-full"
      fit="cover" />
    <Image :src="comic.$thumb" v-if="type != 'small' && !$slots.cover"
      class="ml-[5%] !rounded-lg !min-w-[10%] h-[90%] z-2" fit="contain" />
    <slot name="cover" :src="comic.$thumb.getUrl()" v-else-if="$slots.cover" class="ml-[2%] w-[30%] h-full" />
    <div class="w-full h-[80%] flex items-center relative" v-else>
      <Image v-if="!$slots.cover" :src="comic.$thumb" class="rounded-t-lg h-full w-full" fit="cover" />
      <slot name="cover" :src="comic.$thumb.getUrl()" class="rounded-t-lg h-full w-full" />
      <div
        class="absolute w-full h-6 !text-[10px] text-white bg-[linear-gradient(transparent,rgba(0,0,0,0.9))] bottom-0 flex pb-0.5 items-end justify-start *:flex *:items-center">
        <span class="mx-1">
          <VanIcon class="mr-0.5" name="eye-o" size="14px" />
          <span>{{ comic.totalViews }}</span>
        </span>
        <span>
          <VanIcon class="mr-0.5" name="like-o" size="12px" />
          <span>{{ comic.totalLikes }}</span>
        </span>
      </div>
    </div>
    <div class="w-full h-[18%] overflow-hidden p-1 flex flex-col text-(--van-text-color)" v-if="type == 'small'">
      <div class="flex flex-nowrap">
        <span class="text-(--nui-primary-color)" v-if="!CommonComic.is(comic)">[{{ comic.pagesCount }}p]</span>
        <span class="van-ellipsis">{{ comic.title }}</span>
      </div>
      <div class=" mb-1 w-full h-auto flex-nowrap flex items-center">
        <NIcon color="var(--van-text-color-2)" size="14px">
          <DrawOutlined />
        </NIcon>
        <span @click.stop="$router.force[mode](`/search?keyword=${comic.$author[0]}&mode=author`)"
          class="ml-0.5 text-xs van-ellipsis max-w-2/3 text-(--van-text-color-2)">{{ comic.$author.join(',') }}</span>
      </div>
    </div>
    <div class="w-[62%] min-h-[98%] flex absolute right-[2%] flex-col *:text-justify" ref="info" v-else>
      <span class="mt-[3%] font-[450] text-[1rem]" :class="[resizable || 'van-ellipsis']">{{ comic.title }}</span>
      <slot />
      <div class="absolute bottom-2 text-(--van-text-color-2) text-sm">
        <div class=" flex flex-wrap items-center *:text-nowrap" :class="[resizable || 'van-ellipsis']">
          <NIcon color="var(--van-text-color-2)" size="14px">
            <DrawOutlined />
          </NIcon>
          <span v-for="author of comic.$author" class="mr-2 van-haptics-feedback"
            @click.stop="$router.force[mode](`/search?keyword=${author}&mode=author`)">{{ author }}</span>
        </div>
        <div class="w-full flex -mt-1 text-sm" v-if="!hideViewNumber">
          <span class="flex items-center mr-2 " v-if="comic.totalViews">
            <VanIcon color="var(--van-text-color-2)" name="eye-o" size="14px" />
            <span class="ml-0.5">{{ comic.totalViews }}</span>
          </span>
          <span class="flex items-center" v-if="comic.likesCount">
            <VanIcon color="var(--van-text-color-2)" name="like-o" size="14px" />
            <span class="ml-0.5">{{ comic.likesCount }}</span>
          </span>
        </div>
      </div>
    </div>
  </button>
</template>