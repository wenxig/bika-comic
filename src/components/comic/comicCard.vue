<script setup lang='ts'>
import Image from '../image.vue'
import { toCn } from '@/utils/translator'
import { useElementSize } from '@vueuse/core'
import { shallowRef } from 'vue'
import { max, isEmpty } from 'lodash-es'
import symbol from '@/symbol'
import { CommonComic, FullComic, LessComic } from '@/api/bika/comic'
import { useRouter } from 'vue-router'
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
const handleClick = () => {
  if (!$props.comic) return
  $emit('click')
  $router.force[$props.mode](`/comic/${$props.comic._id}/info`)
}
</script>

<template>
  <button
    class="overflow-hidden w-full van-hairline--bottom flex bg-center bg-(--van-background-2) text-(--van-text-color) border-none relative active:bg-gray p-0 items-start"
    :style="{ [resizable ? 'minHeight' : 'height']: `${((resizable ? max([contentHeight, height]) : height) ?? 0)}px` }"
    :class="[{ 'van-haptics-feedback': !disabled, 'shadow-sm': type == 'big' }, { '!w-[calc(50%-2px)] rounded-lg shadow-sm !block': type == 'small' }]"
    @click="handleClick" :disabled v-if="comic">
    <Image :src="comic.$thumb" v-if="type == 'big' && !$slots.cover" class="blur-lg absolute top-0 left-0 w-full h-full"
      fit="cover" />
    <Image :src="comic.$thumb" v-if="type != 'small' && !$slots.cover" class="ml-[2%] w-[30%] h-full z-[2]"
      fit="contain" />
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
    <div class="w-full h-[20%] overflow-hidden p-1 flex flex-col text-(--van-text-color)" v-if="type == 'small'">
      <div class="flex flex-nowrap">
        <span class="text-(--nui-primary-color)" v-if="!CommonComic.is(comic)">[{{ comic.pagesCount }}p]</span>
        <span class="van-ellipsis">{{ comic.title }}</span>
      </div>
      <div class=" my-1 w-full h-auto flex-nowrap flex items-center">
        <NIcon color="var(--van-text-color-2)" size="14px">
          <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 20 20">
            <g fill="none">
              <path
                d="M14 7.5a1.5 1.5 0 1 1-3 0a1.5 1.5 0 0 1 3 0zm-1 0a.5.5 0 1 0-1 0a.5.5 0 0 0 1 0zM3 6a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3.003c-.341.016-.68.092-1 .229V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8.826a.2.2 0 0 0 .34.142l.807-.796l-.002-.003l1.048-1.03l.206-.202l2.55-2.505a1.5 1.5 0 0 1 2.102 0l1.745 1.714l-.707.708l-1.739-1.709a.5.5 0 0 0-.7 0l-2.756 2.707l-1.851 1.828c-.758.748-2.043.21-2.043-.854V6zm.4 11.035c.369.184.83.335 1.217.25c.251-.056.577-.193.943-.347c.885-.373 2.003-.843 2.862-.497c.637.256.584.981.405 1.33c-.035.066-.008.16.065.177a4.6 4.6 0 0 0 1.112.088a.917.917 0 0 1 .023-.14l.375-1.498c.096-.386.296-.74.578-1.02l4.83-4.83a1.87 1.87 0 1 1 2.644 2.645l-4.83 4.829a2.197 2.197 0 0 1-1.02.578l-1.222.305c-1.121.328-2.794.222-3.313-.183c-.449-.35-.467-.887-.316-1.244c.034-.08-.026-.183-.111-.17c-.495.07-.9.25-1.3.427c-.585.26-1.156.513-1.976.411c-.711-.088-1.107-.459-1.325-.825c-.122-.204.147-.392.36-.286z"
                fill="currentColor"></path>
            </g>
          </svg>
        </NIcon>
        <span @click.stop="$router.force[mode](`/search?keyword=${comic.$author[0]}&mode=author`)"
          class="ml-0.5 text-xs van-ellipsis max-w-2/3 text-(--van-text-color-2)">{{ comic.$author.join(',') }}</span>
      </div>
    </div>
    <div class="w-[62%] min-h-[98%] *:text-sm flex absolute right-[2%] flex-col *:text-justify" ref="info" v-else>
      <span class="font-bold" :class="[resizable || 'van-ellipsis']">
        <template v-if="!hideEpInfo && !CommonComic.is(comic)">
          <VanTag plain type="primary" class="mr-1 !bg-transparent text-nowrap">
            {{ comic.pagesCount }}p
          </VanTag>
          <VanTag plain type="primary" class="mr-1 !bg-transparent text-nowrap">
            {{ comic.epsCount }}ep
          </VanTag>
        </template>
        <span>{{ comic.title }}</span>
      </span>
      <div class="text-(--van-primary-color) flex flex-wrap *:text-nowrap" :class="[resizable || 'van-ellipsis']">
        <span class="font-medium mr-1">作者:</span>
        <span v-for="author of comic.$author" class="mr-2 van-haptics-feedback underline"
          @click.stop="$router.force[mode](`/search?keyword=${author}&mode=author`)">{{ author }}</span>
      </div>
      <span class="text-(--van-text-color-2)" :class="[resizable || 'van-ellipsis']"
        v-if="!LessComic.is(comic) && !isEmpty(comic.$chineseTeam)">
        <span class="font-medium mr-1">汉化:</span>
        <span v-for="ct of comic.$chineseTeam">{{ ct }}</span>
      </span>
      <div class="my-1 w-full h-auto">
        <VanTag type="primary" v-for="tag of comic.categories.slice(0, symbol.comicCardMaxTagsShow)"
          class="mr-1 *:!text-nowrap !text-nowrap">{{ toCn(tag.toString()) }}</VanTag>
        <VanTag type="primary" plain v-if="comic.categories.length > symbol.comicCardMaxTagsShow"
          class="mr-1 *:!text-nowrap !text-nowrap">...</VanTag>
      </div>
      <div class="w-full flex" v-if="!hideViewNumber">
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