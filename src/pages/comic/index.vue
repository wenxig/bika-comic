<script setup lang='ts'>
import { useComicStore } from '@/stores/comic'
import { DriveFolderUploadOutlined, GTranslateOutlined, KeyboardArrowDownRound, PlusRound, ReportGmailerrorredRound, ShareSharp, StarFilled } from '@vicons/material'
import { motion } from 'motion-v'
import { computed, onMounted, shallowRef, watch } from 'vue'
import { createReusableTemplate, until, useScroll, watchDebounced } from '@vueuse/core'
import { DislikeFilled, LikeFilled } from '@vicons/antd'
import { favouriteComic, likeComic } from '@/api/bika/api/comic'
import { useDialog, useMessage } from 'naive-ui'
import { createDateString, toCn } from '@/utils/translator'
import { useRoute, useRouter } from 'vue-router'
import ChildrenComments from '@/components/comment/children.vue'
import PreviewUser from '@/components/user/previewUser.vue'
import { Comment } from '@/api/bika/comment'
import { createCommentsStream } from '@/api/bika/api/comment'
const $route = useRoute()
const _id = $route.params.id.toString()
const comic = useComicStore()
const detail = computed(() => comic.now?.detail.content.value.data)
const preload = computed(() => comic.now?.preload.value)
const pid = computed(() => comic.now?.pid.content.value.data)
const showTitleFull = shallowRef(false)
const $router = useRouter()
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
const $dialog = useDialog()
onMounted(async () => {
  await until(() => comic.now).toBeTruthy()
  if (!comic.now) throw 'error'
  watch(comic.now.veiled, veiled => {
    if (!veiled) $dialog.error({
      title: '错误',
      content: "漫画待审核",
      positiveText: '返回',
      onPositiveClick() {
        $router.back()
      },

    })
  })
})

const previewUser = shallowRef<InstanceType<typeof PreviewUser>>()
const _father = shallowRef<Comment>()
const childrenComments = shallowRef<InstanceType<typeof ChildrenComments>>()
// const commentsStream = createCommentsStream(_id)
const appEl = document.getElementById('app')!
// const appScroll = useScroll(appEl)
const tabOn = shallowRef<'info' | 'comment'>('info')
// watchDebounced([tabOn, appScroll.y], ([tabOn, y]) => {
//   if (tabOn != 'comment') return
//   if (appEl.getBoundingClientRect().height - y <= 20) {
//     commentsStream.next()
//   }
// }, {
//   debounce: 200
// })

</script>

<template>
  <div class="*:w-full" v-if="comic.now">
    <div class="bg-black text-white h-[30vh] flex justify-center">
      <Image class="h-full" :src="detail?.$thumb" />
    </div>
    <Content :source="comic.now.detail.content.value">
      <VanTabs shrink swipeable sticky v-model:active="tabOn">
        <VanTab class="min-h-full van-hairline--top pt-3" title="简介" name="info">
          <div class="flex items-center relative">
            <Image class="size-8.5 shrink-0 mx-3" :src="detail?.$_creator.$avatar" round />
            <div class="flex flex-col w-full text-nowrap">
              <div class="text-(--nui-primary-color) flex items-center">
                <span v-for="author of preload?.$author" class="mr-0.5">{{ author }}</span>
              </div>
              <div class="-mt-0.5 van-ellipsis max-w-2/3 text-(--van-text-color-2) text-[11px] flex items-center">
                <NIcon class="mr-0.5">
                  <DriveFolderUploadOutlined />
                </NIcon>
                <span>
                  {{ detail?.$_creator.name }}
                </span>
                <template v-if="detail?.chineseTeam">
                  <NIcon class="ml-2 mr-0.5">
                    <GTranslateOutlined />
                  </NIcon>
                  <span v-for="chineseTeam of detail?.$chineseTeam">
                    {{ chineseTeam }}
                  </span>
                </template>
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
                  <div class="text-xs mt-1 font-light flex text-(--van-text-color-2) *:flex *:items-center">
                    <span class="mr-1">
                      <VanIcon class="mr-0.5 " name="eye-o" size="14px" />
                      <span>{{ preload?.totalViews }}</span>
                    </span>
                    <span class="mx-1">
                      <span>{{ createDateString(detail?.$created_at) }}</span>
                    </span>
                  </div>
                </TitleTemp>
                <AnimatePresence>
                  <motion.div :initial="{ opacity: 0 }" :exit="{ opacity: 0 }" key="info" :animate="{ opacity: 1 }"
                    v-if="!showTitleFull" class="flex flex-col absolute top-0 van-ellipsis w-full">
                    <span @click="showTitleFull = !showTitleFull">{{ preload?.title }}</span>
                    <TitleComp />
                  </motion.div>
                </AnimatePresence>
                <NCollapseTransition :show="showTitleFull" class="!w-[calc(100%+2rem)]">
                  <span @click="showTitleFull = !showTitleFull" class="w-[calc(100%-2rem)]">{{ preload?.title }}</span>
                  <TitleComp />
                  <div class="flex  font-light text-(--van-text-color-2) justify-start text-xs mt-0.5">
                    <div class="mr-2">
                      PICA{{ pid }}
                    </div>
                    <div>
                      ###{{ preload?._id }}
                    </div>
                  </div>
                  <Text class="font-[350]  mt-1 text-(--van-text-color-2) justify-start text-xs">
                    {{ detail?.description }}
                  </Text>
                  <div class=" mt-6 flex flex-wrap gap-2.5 *:!px-3 **:!text-xs">
                    <NButton tertiary round
                      v-for="category of detail?.categories.toSorted((a, b) => b.length - a.length)" type="primary"
                      size="small">
                      {{ toCn(category) }}
                    </NButton>
                    <NButton tertiary round v-for="tag of detail?.tags.toSorted((a, b) => b.length - a.length)"
                      class="!text-(--van-text-color-2)" size="small">
                      {{ toCn(tag) }}
                    </NButton>
                  </div>
                </NCollapseTransition>
              </div>
              <NIcon size="2rem" color="var(--van-text-color-3)" class="absolute -top-0.5 -right-1 transition-transform"
                :class="[showTitleFull && '!rotate-180']" @click="showTitleFull = !showTitleFull">
                <KeyboardArrowDownRound />
              </NIcon>
            </div>
            <div class="mt-8 mb-4 flex justify-around" v-if="preload">
              <ToggleIcon size="30px" @update:model-value="v => detail && (detail.isLiked = v)"
                :model-value="detail?.isLiked ?? false" @change="likeComic(preload._id)" :icon="LikeFilled">
                {{ detail?.likesCount ?? '喜欢' }}
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

        <VanTab class="min-h-full van-hairline--top" title="评论" name="comment">
          <template #title>
            <span>评论</span>
            <span class="!text-xs ml-0.5 font-light">{{ detail?.totalComments ?? '' }}</span>
          </template>
          <CommentView no-virtual :id="_id" list-class="min-h-[calc(70vh-var(--van-tabs-line-height))]"
            class="min-h-[calc(70vh-var(--van-tabs-line-height))]" />
        </VanTab>
      </VanTabs>
    </Content>
  </div>
  <ChildrenComments ref="childrenComments" anchors="low" :_father @show-user="previewUser?.show" />
  <PreviewUser ref="previewUser" />
</template>
<style scoped lang='scss'>
:global(#app) {
  background-color: var(--van-background-2);
}
</style>