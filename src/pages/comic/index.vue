<script setup lang='ts'>
import { useComicStore } from '@/stores/comic'
import { DriveFolderUploadOutlined, GTranslateOutlined, KeyboardArrowDownRound, PlusRound, ReportGmailerrorredRound, ShareSharp, StarFilled } from '@vicons/material'
import { motion } from 'motion-v'
import { computed, shallowRef } from 'vue'
import { createReusableTemplate } from '@vueuse/core'
import { DislikeFilled, LikeFilled } from '@vicons/antd'
import { favouriteComic, likeComic } from '@/api/bika/api/comic'
import { useMessage } from 'naive-ui'
import { toCn } from '@/utils/translator'
const comic = useComicStore()
const detail = computed(() => comic.now?.detail.content.value.data)
const preload = computed(() => comic.now?.preload.value)
const pid = computed(() => comic.now?.pid.content.value.data)
const showTitleFull = shallowRef(false)

const [TitleTemp, TitleComp] = createReusableTemplate()
const shareComic = () => {
  if (!pid.value || !preload.value) return
  navigator.share({
    url: location.href,
    text: `${preload.value.title}(PICA${pid.value})`,
    title: 'bika的漫画分享'
  })
}
const $message = useMessage()
</script>

<template>
  <div class="*:w-full" v-if="comic.now">
    <div class="bg-black text-white h-[30vh] flex justify-center">
      <Image class="h-full" :src="detail?.$thumb" />
    </div>
    <Content :source="comic.now.detail.content.value">
      <VanTabs shrink swipeable>
        <VanTab class="min-h-full van-hairline--top pt-3" title="简介">
          <div class="flex items-center relative">
            <Image class="size-8.5 shrink-0 mx-3" :src="detail?.$_creator.$avatar" round />
            <div class="flex flex-col w-full text-nowrap">
              <div class="text-(--nui-primary-color) flex items-center">
                <span v-for="author of preload?.$author" class="mr-0.5">{{ author }}</span>
              </div>
              <div class="-mt-0.5 van-ellipsis max-w-2/3 text-(--van-text-color-2) text-[11px] flex items-center">
                <template v-if="detail?.chineseTeam">
                  <NIcon class="mr-1">
                    <GTranslateOutlined />
                  </NIcon>
                  <span v-for="chineseTeam of detail?.$chineseTeam">
                    {{ chineseTeam }}
                  </span>
                </template>
                <NIcon class="mx-0.5">
                  <DriveFolderUploadOutlined />
                </NIcon>
                <span>
                  {{ detail?.$_creator.title }}
                </span>
              </div>
            </div>
            <NButton round type="primary" class="!absolute right-3" size="small">
              <template #icon>
                <NIcon>
                  <PlusRound />
                </NIcon>
              </template>
              关注
            </NButton>
          </div>

          <div class="w-[95%] mx-auto mt-4">
            <div class="flex relative h-fit">
              <div class="text-[17px] font-[460] w-[90%] relative">
                <TitleTemp>
                  <div class="text-xs mt-1 font-light w-full flex text-(--van-text-color-2) *:flex *:items-center">
                    <span class="mr-1">
                      <VanIcon class="mr-0.5" name="eye-o" size="14px" />
                      <span>{{ preload?.totalViews }}</span>
                    </span>
                    <span class="mx-1">
                      <span>{{ detail?.$created_at.format('YYYY年M月D日 HH:mm') }}</span>
                    </span>
                  </div>
                </TitleTemp>
                <AnimatePresence>
                  <motion.div :initial="{ opacity: 0 }" :exit="{ opacity: 0 }" key="info" :animate="{ opacity: 1 }"
                    v-if="!showTitleFull" class="van-ellipsis flex flex-col absolute top-0">
                    <span @click="showTitleFull = !showTitleFull">{{ preload?.title }}</span>
                    <TitleComp />
                  </motion.div>
                </AnimatePresence>
                <NCollapseTransition :show="showTitleFull" class="">
                  <span @click="showTitleFull = !showTitleFull">{{ preload?.title }}</span>
                  <TitleComp />
                  <div class="flex font-light text-(--van-text-color-2) justify-start text-xs mt-0.5">
                    <div class="mr-2">
                      PICA{{ pid }}
                    </div>
                    <div>
                      ###{{ preload?._id }}
                    </div>
                  </div>
                  <Text class="font-[350] mt-1 text-(--van-text-color-2) justify-start text-xs">
                    {{ detail?.description }}
                  </Text>
                  <div class="w-full *:!mr-2 mt-5 flex flex-wrap *:!mt-1 *:!px-2.5 **:!text-xs">
                    <NButton tertiary round v-for="category of detail?.categories" type="primary" size="small">
                      {{ toCn(category) }}
                    </NButton>
                    <NButton tertiary round v-for="tag of detail?.tags" size="small">
                      {{ toCn(tag) }}
                    </NButton>
                  </div>
                </NCollapseTransition>
              </div>
              <NIcon size="2rem" color="var(--van-text-color-3)" class="absolute -top-0.5 -right-1"
                @click="showTitleFull = !showTitleFull">
                <KeyboardArrowDownRound />
              </NIcon>
            </div>
            <div class="mt-8 mb-4 flex justify-around" v-if="preload">
              <ToggleIcon size="30px" @update:model-value="v => detail && (detail.isLiked = v)"
                :model-value="detail?.isLiked ?? false" @change="likeComic(preload._id)" :icon="LikeFilled">
                {{ detail?.likesCount }}
              </ToggleIcon>
              <ToggleIcon size="30px" :icon="DislikeFilled" @click="$message.info('个性化功能设计中')" dis-changed>
                不喜欢
              </ToggleIcon>
              <ToggleIcon size="30px" dis-changed :icon="ReportGmailerrorredRound">
                举报
              </ToggleIcon>
              <ToggleIcon size="30px" @update:model-value="v => detail && (detail.isFavourite = v)"
                :model-value="detail?.isFavourite ?? false" @change="favouriteComic(preload._id)" :icon="StarFilled">
                收藏
              </ToggleIcon>
              <ToggleIcon size="30px" @click="shareComic()" :icon="ShareSharp" dis-changed>
                分享
              </ToggleIcon>
            </div>
          </div>
          <Content :source="comic.now.recommendComics.content.value" v-slot="{ data }" class="van-hairline--top w-full">
            <template v-if="data">
              <ComicCard v-for="comic of data" :comic :height="140" />
            </template>
          </Content>
        </VanTab>

        <VanTab class="min-h-full van-hairline--top" title="评论">
          <template #title>
            <span>评论</span>
            <span class="!text-xs ml-0.5 font-light">{{ detail?.totalComments ?? '' }}</span>
          </template>
          456
        </VanTab>
      </VanTabs>
    </Content>
  </div>
</template>
<style scoped lang='scss'>
:global(#app) {
  background-color: var(--van-background-2);
}
</style>