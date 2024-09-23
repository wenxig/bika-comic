<script setup lang='ts'>
import { computed } from 'vue'
import { isEmpty } from 'lodash-es'
import config from '@/config'
import { Ep } from '@/api'
import { StateContentData } from '@/utils/requset'
import { useComicStore } from '@/stores/comic'
const $props = withDefaults(defineProps<{
  eps: Ep[],
  id: string,
  mode?: 'push' | 'replace'
  now?: Ep['order'],
  state?: StateContentData<Ep[]>
}>(), {
  mode: 'push'
})
const eps = computed(() => config.value['bika.info.unsortComic'] ? $props.eps.toReversed() : $props.eps)
const comicStore = useComicStore()
</script>

<template>
  <div class="w-full flex flex-wrap">
    <StateContent :is-empty="state?.isEmpty" :is-error="state?.isError" :is-loading="state?.isLoading ?? true" retriable
      @retry="comicStore.$retryEps">
      <div class="w-full text-sm text-[--van-text-color-2] pl-2">
        <div class="h-5 flex items-center" @click="config['bika.info.unsortComic'] = !config['bika.info.unsortComic']">
          反向排序<van-icon name="exchange" /></div>
      </div>
      <VanButton type="primary" plain class="!h-auto !min-h-[--van-button-default-height] w-[calc(25vw-8px)] !m-1"
        v-for="ep of eps" @click="$router.force[mode](`/comic/${id}/read/${ep.order}`)" :disabled="ep.order == now">
        {{ ep.title }}
      </VanButton>
    </StateContent>
  </div>
</template>