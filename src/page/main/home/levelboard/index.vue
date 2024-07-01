<script setup lang='ts'>
import { shallowRef } from 'vue'
import { isEmpty } from 'lodash-es'
import ComicTotel from './comicTotel.vue'
import PreviewUser from '@/components/user/previewUser.vue'
import { isDark } from '@/config'
import { useAppStore } from '@/stores'
document.title = '排行榜 | bika'
const previewUser = shallowRef<InstanceType<typeof PreviewUser>>()
const app = useAppStore()

</script>

<template>
  <VanTabs class="w-full !h-full pt-1" swipeable>
    <VanTab title="漫画榜">
      <VanTabs swipeable class="w-full !h-full">
        <VanTab class="overflow-hidden" title="过去一天">
          <ComicTotel :data="app.levelBoard?.comics[0] ?? []" />
        </VanTab>
        <VanTab class="overflow-hidden" title="过去一周">
          <ComicTotel :data="app.levelBoard?.comics[1] ?? []" />
        </VanTab>
        <VanTab class="overflow-hidden" title="过去一月">
          <ComicTotel :data="app.levelBoard?.comics[2] ?? []" />
        </VanTab>
      </VanTabs>
    </VanTab>
    <VanTab title="骑士榜" class="h-full *:h-full *:*:h-full">
      <List :item-height="100" :data="app.levelBoard?.users ?? []"
        class="!h-[calc(100%-var(--van-tabs-line-height)+4px)] text-[--van-text-color] w-full"
        :is-requesting="isEmpty(app.levelBoard?.users)" v-slot="{ data: { item: user, index }, height }">
        <div class="flex" :style="`height: ${height}px;`" @click="previewUser?.show(user)">
          <div
            :style="[`background-color:rgba(219,54,124,${1 - (index * 0.1)});`, `color: rgb(${isDark ? 255 : (255 / 40) * (40 - (index + 1))},${isDark ? 255 : (255 / 40) * (40 - (index + 1))},${isDark ? 255 : (255 / 40) * (40 - (index + 1))});`]"
            class="flex justify-center items-center text-3xl !w-[10%] van-hairline--top text-white">
            {{ index + 1 }}
          </div>
          <div class="w-[90%] van-hairline--bottom bg-[--van-background-2] h-full flex items-center">
            <Image :src="user.avatar" class="h-[80px] w-[80px] ml-1" round />
            <div class="ml-3 w-[calc(100%-80px-(4px*3))] h-full flex flex-col ">
              <span class="text-xl font-bold">{{ user.name }}</span>
              <span class="text-[--p-color] -mt-1">lv.{{ user.level }}</span>
              <span class="text-gray-600 text-lg -mt-1">上传数:{{ user.comicsUploaded }}</span>
            </div>
          </div>
        </div>
      </List>
    </VanTab>
  </VanTabs>
  <PreviewUser ref="previewUser" />
</template>
<style scoped lang='scss'>
:deep(.van-tabs__content) {
  height: 100% !important;
  max-height: 100% !important;
}
</style>