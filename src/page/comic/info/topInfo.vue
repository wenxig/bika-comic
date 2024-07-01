<script setup lang='ts'>
import Image from '@/components/image.vue'
import { isEmpty } from 'lodash-es'
import { ProPlusComic } from '@/api'
import { toCn } from '@/utils/translater'
import { ProPlusMaxComic } from '@/api'
import { useAppStore } from '@/stores'
withDefaults(defineProps<{
  comic?: ProPlusMaxComic | ProPlusComic
  mode?: 'push' | 'replace'
}>(), {
  mode: 'push'
})
const app = useAppStore()

</script>

<template>
  <template v-if="comic">
    <VanRow class="p-1 *:min-h-40 min-h-40">
      <VanCol span="8" class="max-h-full !flex items-center">
        <Image :src="comic.thumb" class="w-full" fit="cover" previewable />
      </VanCol>
      <VanCol span="15" class="ml-1 flex flex-col *:text-sm">
        <div class="font-bold text-[--van-text-color]">
          <span v-if="comic.finished" class="text-[--van-primary-color]">[完结]</span>
          <span v-if="(comic instanceof ProPlusMaxComic)" class="text-[--p-color]">[{{ comic.pagesCount }}p]</span>
          <span v-if="(comic instanceof ProPlusMaxComic)" class="text-[--p-color]">[{{ comic.epsCount }}ep]</span>
          {{ comic.title }}
        </div>
        <div class="text-[--van-primary-color] van-haptics-feedback"
          @click="comic && $router.force[mode](`/search?keyword=${comic.author}&mode=anthor`)">
          作者：{{
            comic.author }}
        </div>
        <div class="text-[--van-primary-color] van-haptics-feedback" v-if="comic && !isEmpty(comic.chineseTeam)"
          @click="comic && $router.force[mode](`/search?keyword=${comic.chineseTeam}&mode=translater`)">汉化：{{
            comic.chineseTeam
          }}
        </div>
        <div class="text-[--van-text-color-2]">分类:<span v-for="c of comic.categories" class="ml-1 van-haptics-feedback"
            @click="$router.force[mode]({ path: `/search`, query: { keyword: encodeURIComponent(c), mode: 'categories' }, replace: true })">{{ toCn(c) }}</span>
        </div>
        <div class=" w-full flex text-[--van-text-color]">
          <span class="flex items-center" v-if="comic.totalViews">
            <VanIcon name="eye-o" size="16px" />
            <span class="ml-1 text-[13px]">{{ comic.totalViews }}</span>
          </span>
        </div>
      </VanCol>
    </VanRow>
    <VanRow>
      <template v-if="comic">
        <van-tag type="primary" v-for="tag of comic.tags" class="m-1 text-nowrap van-haptics-feedback" size="medium"
          @click="$router.force[mode]({ path: `/search`, query: { keyword: encodeURIComponent(tag), mode: 'tag' } })">{{ toCn(tag) }}</van-tag>
      </template>
    </VanRow>
    <VanRow class=" *:text-xs p-1 text-[--van-text-color-2]">
      <template v-if="comic">
        <Text :text="comic.description" />
      </template>
    </VanRow>
    <VanRow v-if="app.levelBoard.comics.some(v => v.some(v => v._id == comic?._id))" class="py-1 ">
      <VanCol span="8">
        <NStatistic label="日榜">
          {{ (app.levelBoard.comics[0].findIndex(v => v._id == comic?._id) + 1) || '未上榜' }}
        </NStatistic>
      </VanCol>
      <VanCol span="8">
        <NStatistic label="周榜">
          {{ (app.levelBoard.comics[1].findIndex(v => v._id == comic?._id) + 1) || '未上榜' }}
        </NStatistic>
      </VanCol>
      <VanCol span="8">
        <NStatistic label="月榜">
          {{ (app.levelBoard.comics[2].findIndex(v => v._id == comic?._id) + 1) || '未上榜' }}
        </NStatistic>
      </VanCol>
    </VanRow>
  </template>
</template>