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
  <VanRow @click="comic && previewUser?.show(comic._creator)"
    class="van-hairline--top-bottom mt-1 *:!flex *:justify-center *:items-center">
    <VanSkeleton avatar avatar-size="3.5rem" :row="2" row-width="50%" class="w-full"
      :loading="(!comic?._creator) || (!comic?.updated_at) || (!comic?.created_at)">
      <VanCol span="6">
        <Image :src="comic?._creator.avatar" class="h-[3.5rem] w-[3.5rem]" round fit="cover" />
      </VanCol>
      <VanCol class="flex-col !items-start text-[--van-text-color]">
        <div class="font-[500]">{{ comic?._creator.name }}</div>
        <span class="text-xs ml-2">
          <NTime :time="comic?.updated_time" />更新
        </span>
        <span class="text-xs ml-2 text-[--van-text-color-2]">
          <NTime :time="comic?.created_time" />创建
        </span>
      </VanCol>
    </VanSkeleton>
  </VanRow>
  <PreviewUser ref="previewUser" />
</template>