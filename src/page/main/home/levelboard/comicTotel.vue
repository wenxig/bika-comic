<script setup lang='ts'>
import { ProComic, ProPlusComic } from '@/api'
import { isDark } from '@/config'
import { isEmpty } from 'lodash-es'

defineProps<{
  data: (ProComic | ProPlusComic)[]
}>()
</script>

<template>
  <List :item-height="120" :data item-resizable
    class="!h-[calc(100vh-var(--van-tabs-line-height)-var(--van-tabs-line-height)-2px-var(--header-search-height)-var(--header-select-height)-8px-var(--van-tabs-line-height))] w-full"
    :is-requesting="isEmpty(data)" v-slot="{ data: { item: comic, index }, height }">
    <div class="flex" :style="`min-height: ${height}px;`">
      <div
        :style="[`background-color:rgba(219,54,124,${1 - (index * 0.1)});`, `color: rgb(${isDark ? 255 : (255 / 40) * (40 - (index + 1))},${isDark ? 255 : (255 / 40) * (40 - (index + 1))},${isDark ? 255 : (255 / 40) * (40 - (index + 1))});`]"
        class="flex justify-center items-center text-3xl !w-[10%] van-hairline--top text-white">
        {{ index + 1 }}
      </div>
      <ComicCard :comic :height class="!w-[90%]" />
    </div>
  </List>
</template>

<style scoped lang='scss'>
:deep(* *, *) {
  transition: all 0s !important;
}
</style>