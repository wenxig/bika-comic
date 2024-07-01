<script setup lang='ts'>
import { ProPlusMaxComic } from '@/api'
import PreviewUser from '@/components/user/previewUser.vue'
import { shallowRef } from 'vue'
withDefaults(defineProps<{
  comic?: ProPlusMaxComic
  mode?: 'push' | 'replace'
}>(), {
  mode: 'push'
})
const previewUser = shallowRef<InstanceType<typeof PreviewUser>>()
</script>

<template>
  <template v-if="comic">
    <VanRow @click="comic && previewUser?.show(comic._creator)"
      class="van-hairline--top-bottom mt-1 *:!flex *:justify-center *:items-center" v-if="comic">
      <VanCol span="6">
        <Image :src="comic._creator.avatar" class="h-[3.5rem] w-[3.5rem]" round fit="cover" />
      </VanCol>
      <VanCol class="flex-col !items-start text-[--van-text-color]">
        <div class="font-[500]">{{ comic._creator.name }}</div>
        <span class="text-xs ml-2">
          <NTime :time="comic.updated_time" />更新
        </span>
        <span class="text-xs ml-2 text-[--van-text-color-2]">
          <NTime :time="comic.created_time" />创建
        </span>
      </VanCol>
    </VanRow>
  </template>
  <PreviewUser ref="previewUser" />
</template>