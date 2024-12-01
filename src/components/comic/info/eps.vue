<script setup lang='ts'>
import { computed } from 'vue'
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
  <div class="w-full flex flex-wrap justify-evenly">
    <StateContent :is-empty="state?.isEmpty" :is-error="state?.isError" :is-loading="state?.isLoading ?? true" retriable
      @retry="comicStore.$retryEps" class="w-full !my-1">
      <div class="w-full text-sm text-[--van-text-color-2] pl-2 mt-1">
        <div class="h-5 flex items-center" @click="config['bika.info.unsortComic'] = !config['bika.info.unsortComic']">
          反向排序<van-icon name="exchange" /></div>
      </div>
      <VanButton type="primary" plain style="--width: calc(33vw - 8px);"
        class="!h-auto !min-h-[--van-button-default-height] w-[--width] mt-1 last:mb-1" v-for="ep of eps"
        @click="$router.force[mode](`/comic/${id}/read/${ep.order}`)" :disabled="ep.order == now">
        <div class="text-wrap w-[--width] break-words">{{ ep.title }}
        </div>
        <NTime format="yyyy-mm-dd" :time="ep.updated_time" class="!text-[--primary-color-light]" />
      </VanButton>
    </StateContent>
  </div>
</template>