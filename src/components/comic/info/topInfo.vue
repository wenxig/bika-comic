<script setup lang='ts'>
import Image from '@/components/image.vue'
import { isEmpty, isUndefined, last } from 'lodash-es'
import { spiltAnthors, toCn } from '@/utils/translater'
import { ProComic, ProPlusComic } from '@/api'
import { useAppStore } from '@/stores'
import symbol from '@/symbol'
import { computed } from 'vue'
import { PreloadValue } from '@/stores/comic'
import { asyncComputed, useClipboard } from '@vueuse/core'
import { searchModeMap } from '../../../utils/translater'
const $props = withDefaults(defineProps<{
  comic?: PreloadValue
  mode?: 'push' | 'replace'
}>(), {
  mode: 'push'
})
const app = useAppStore()
const thirdParty = computed(() => ({
  isHave: (/pixiv/ig).test($props.comic?.title ?? '') && (/\d{6,}/ig).test($props.comic?.title ?? ''),
  linkToUser: `https://www.pixiv.net/users/${last($props.comic?.title?.match(/\d{6,}/ig))}`,
}))
const $window = window

const clipboard = useClipboard({ legacy: true })

const picid = asyncComputed(() => $props.comic?.picId)
</script>

<template>
  <VanRow class="p-1 *:min-h-[170px] min-h-[170px]">
    <VanCol span="8" class="max-h-full !flex items-center">
      <VanSkeleton class="w-full h-[170px] !p-0" :loading="!comic?.thumb">
        <template #template>
          <VanSkeletonImage class="!w-full !h-[170px]" />
        </template>
        <Image :src="comic?.thumb" class="w-full" fit="cover" previewable />
      </VanSkeleton>
    </VanCol>
    <VanCol span="15" class="ml-1 flex flex-col *:text-sm">
      <div class="font-bold text-[--van-text-color]" @click="thirdParty.isHave && $window.open(thirdParty.linkToUser)">
        <VanSkeleton class="!px-0 !pb-1" :loading="!comic" row="1">
          <template #template>
            <VanSkeletonParagraph />
          </template>
          <VanTag plain type="primary" v-if="comic?.finished" class="mr-1">完结</VanTag>
          <VanTag plain type="primary" v-if="comic && !(comic instanceof ProPlusComic)" class="mr-1">
            {{ comic.pagesCount }}p
          </VanTag>
          <VanTag plain type="primary" v-if="comic && !(comic instanceof ProPlusComic)" class="mr-1">
            {{ comic.epsCount }}ep
          </VanTag>
          <span :class="[thirdParty.isHave && 'underline underline-offset-4']" class="">{{ comic?.title }}</span>
          <span v-if="thirdParty.isHave" class="text-[--van-text-color-3] text-xs italic font-thin"># 1个相关页面</span>
        </VanSkeleton>
      </div>
      <VanSkeleton class="!px-0 !pb-1" :loading="!comic" v-if="(comic?.author != undefined) && !isEmpty(comic?.author)">
        <template #template>
          <VanSkeletonParagraph row-width="50%" />
        </template>
        <div class="text-[--van-primary-color] *:text-nowrap flex flex-wrap">
          <span class="font-medium mr-1">作者:</span>
          <span v-for="author of spiltAnthors(comic?.author)" class="mr-2 van-haptics-feedback underline"
            @click="comic && $router.force[mode](`/search?keyword=${author}&mode=anthor`)">{{ author }}</span>
        </div>
      </VanSkeleton>
      <VanSkeleton class="!px-0 !pb-1" :loading="!comic" row="1"
        v-if="!(comic instanceof ProComic) && !isEmpty(comic?.chineseTeam) && comic?.chineseTeam != 'null'">
        <template #template>
          <VanSkeletonParagraph row-width="50%" />
        </template>
        <div class="text-[--van-primary-color] van-haptics-feedback"
          @click="comic && $router.force[mode](`/search?keyword=${comic.chineseTeam}&mode=translater`)">
          <span class="font-medium mr-1">汉化:</span>
          <span>{{ comic?.chineseTeam }}</span>
        </div>
      </VanSkeleton>
      <div class="text-[--van-text-color-2]">
        <VanSkeleton :loading="!comic?.categories" class="!px-0 !pb-1" row="1">
          <template #template>
            <VanSkeletonParagraph class="!p-0" row-width="50%" />
          </template>
          <span class="font-medium mr-1">分类:</span>
          <span v-for="c of comic?.categories" class="van-haptics-feedback ml-1"
            @click="$router.force[mode]({ path: `/search`, query: { keyword: encodeURIComponent(c.toString()), mode: 'categories' }, replace: true })">{{ toCn(c.toString()) }}</span>
        </VanSkeleton>
      </div>
      <!-- <VanSkeleton row="1" :loading="!picid" class="!px-0 !pb-1">
        <div v-if="picid" class="flex *:block items-center"
          @click="clipboard.copy(`${searchModeMap.pid}${picid}`).then(() => $window.$message.success('成功(Pica)！'))">
          <VanIcon name="records-o"></VanIcon>
          <span class="font-medium mr-1">PicaId:</span>
          <span>{{ picid }}</span>
        </div>
      </VanSkeleton> -->
      <div class="text-[--van-text-color-2] my-1 text-nowrap">
        <VanSkeleton row="1" :loading="!comic?._id" class="!px-0 !pb-1">
          <div v-if="comic?._id" class="flex *:block items-center"
            @click="clipboard.copy(`${searchModeMap.id}${comic._id}`).then(() => $window.$message.success('成功(Sys)！'))">
            <VanIcon name="records-o"></VanIcon>
            <span class="font-medium mr-1">SysId:</span>
            <span>{{ comic._id }}</span>
          </div>
        </VanSkeleton>
      </div>
      <div class="w-full flex text-[--van-text-color]">
        <VanSkeleton class="!px-0 !pb-1 w-full flex text-[--van-text-color]"
          :loading="isUndefined(comic?.totalViews) && isUndefined(comic?.totalLikes)">
          <template #template>
            <VanSkeletonParagraph row-width="30%" />
            <VanSkeletonParagraph row-width="30%" class="ml-1 !mt-0" />
          </template>
          <span class="flex items-center">
            <VanIcon name="eye-o" size="16px" />
            <span class="ml-1 text-[13px]">{{ comic?.totalViews }}</span>
          </span>
          <span class="flex items-center ml-1">
            <VanIcon name="like-o" size="16px" />
            <span class="ml-1 text-[13px]">{{ comic?.totalLikes }}</span>
          </span>
        </VanSkeleton>
      </div>
    </VanCol>
  </VanRow>
  <VanRow>
    <VanSkeleton :loading="!(comic instanceof ProComic) && !comic?.tags"
      class="!p-0 w-full !py-1 flex flex-wrap *:!mt-0">
      <template #template>
        <VanSkeletonParagraph class="m-1" row-width="40px" />
        <VanSkeletonParagraph class="m-1" row-width="40px" />
        <VanSkeletonParagraph class="m-1" row-width="40px" />
      </template>
      <van-tag type="primary" v-for="tag of !(comic instanceof ProComic) ? comic?.tags : []"
        class="m-1 text-nowrap van-haptics-feedback" size="medium"
        @click="$router.force[mode]({ path: `/search`, query: { keyword: encodeURIComponent(tag), mode: 'tag' } })">{{ toCn(tag) }}</van-tag>
    </VanSkeleton>
  </VanRow>
  <VanRow class="*:text-xs p-1 text-[--van-text-color-2]">
    <VanSkeleton class="!p-0 !pb-1 w-full" :row="2" :loading="!comic">
      <template v-if="!(comic instanceof ProComic) && comic?.description">
        <div class="w-[98%] bg-red-500 bg-opacity-20 rounded-lg px-2 text-[--van-text-color]" style="margin: 0 auto;"
          v-if="comic?.description.includes(symbol.hardToReadText)">
          <h2 class="!text-red-500">重口警告</h2>
          <p>这个本子已被标记为重口（官方声明</p>
          <p>请注意，这个本子的内容过于重口味，可能会引起恶心、头晕等不适症状，也可能对您的情绪产生负面影响。因此，我们认为这个本子不适合任何人观看。</p>
          <p>如果您仍然坚持观看，请自行承担观看后的后果。如果出现任何不适症状，请立即停止观看并及时向医生寻求帮助。</p>
        </div>
        <Text :text="comic?.description.replaceAll(symbol.hardToReadText, '')" />
      </template>
    </VanSkeleton>
  </VanRow>
  <VanRow v-if="app.levelBoard.comics.some(v => v.some(v => v._id == comic?._id))" class="py-1 ">
    <VanCol span="8">
      <NStatistic label="日榜">
        {{(app.levelBoard.comics[0].findIndex(v => v._id == comic?._id) + 1) || '未上榜'}}
      </NStatistic>
    </VanCol>
    <VanCol span="8">
      <NStatistic label="周榜">
        {{(app.levelBoard.comics[1].findIndex(v => v._id == comic?._id) + 1) || '未上榜'}}
      </NStatistic>
    </VanCol>
    <VanCol span="8">
      <NStatistic label="月榜">
        {{(app.levelBoard.comics[2].findIndex(v => v._id == comic?._id) + 1) || '未上榜'}}
      </NStatistic>
    </VanCol>
  </VanRow>
</template>
<style scoped lang='scss'>
:deep(.n-statistic) {
  .n-statistic-value {
    padding-left: 1rem;
  }

  .n-statistic__label {
    padding-left: 0.5rem;
  }
}
</style>