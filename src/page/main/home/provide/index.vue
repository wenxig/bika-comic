<script setup lang='ts'>
import { useAppStore } from '@/stores'
import { useComicStore } from '@/stores/comic'
import { toCn } from '@/utils/translater'
import { chunk, isEmpty } from 'lodash-es'
import { useRoute } from 'vue-router'

const $route = useRoute()
const name = $route.params.name.toString()
const app = useAppStore()
const space = app.collections_list.find(v => v.title == name)
const comicStore = useComicStore()
</script>

<template>
  <List :item-height="260" :data="chunk(space?.comics, 2)" class="h-full w-full pt-1"
    :is-requesting="isEmpty(app.collections_list)" :end="!isEmpty(app.collections_list)"
    v-slot="{ height, data: { item: comics } }" ref="list">
    <div class="flex justify-between w-[calc(100%-12px)]" :style="{ height: `${height}px` }">
      <div v-for="comic of comics" class="bg-[--van-background-2] w-[calc(50%-2px)] mb-1 rounded-lg shadow-sm"
        @click="() => { comicStore.$setupPreload(comic); $router.force.push(`/comic/${comic._id}/info`) }">
        <div class="w-full h-[80%] flex items-center relative">
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
        <div class="w-full h-[20%] overflow-hidden flex flex-col text-[--van-text-color]">
          <span class="font-bold van-ellipsis">{{ comic.title }}</span>
          <div class=" my-1 w-full h-auto flex-nowrap flex">
            <van-tag type="primary" v-for="tag of comic.categories.slice(0, 3)"
              class="mr-1 text-nowrap">{{ toCn(tag) }}</van-tag>
            <van-tag type="primary" plain v-if="comic.categories.length > 3" class="mr-1 text-nowrap">...</van-tag>
          </div>
        </div>
      </div>
    </div>
  </List>
</template>