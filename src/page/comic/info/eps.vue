<script setup lang='ts'>
import { computed } from 'vue'
import { isEmpty } from 'lodash-es'
import config from '@/config'
import { Ep } from '@/api'
const $props = withDefaults(defineProps<{
  eps: Ep[],
  id: string,
  mode?: 'push' | 'replace'
  now?: Ep['order']
}>(), {
  mode: 'push'
})
const eps = computed(() => config.value.unsortComic ? $props.eps.toReversed() : $props.eps)

</script>

<template>
  <div class="w-full flex flex-wrap">
    <template v-if="!isEmpty(eps)">
      <div class="w-full text-sm text-[--van-text-color-2] pl-2">
        <div class="h-5 flex items-center" @click="config.value.unsortComic = !config.value.unsortComic">反向排序<van-icon
            name="exchange" /></div>
      </div>
      <VanButton type="primary" plain class="!h-auto !min-h-[--van-button-default-height] w-[calc(25vw-8px)] !m-1"
        v-for="ep of eps" @click="$router.force[mode](`/comic/${id}/read/${ep.order}`)" :disabled="ep.order == now">
        {{ ep.title }}
      </VanButton>
    </template>
    <div class="w-full flex justify-center items-center my-1" v-else>
      <van-loading size="24px">加载中...</van-loading>
    </div>
  </div>
</template>