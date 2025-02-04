<script setup lang='ts'>
import { computed } from 'vue'
import config from '@/config'
import { ComicEps, Ep } from '@/api'
import { UseStateContent } from '@/utils/requset'
import { useComicStore } from '@/stores/comic'
const $props = withDefaults(defineProps<{
  eps?: UseStateContent<ComicEps>,
  id: string,
  mode?: 'push' | 'replace'
  now?: Ep['order'],
}>(), {
  mode: 'push',
})
const eps = computed(() => $props.eps && (config.value['bika.info.unsortComic'] ? $props.eps.data?.toReversed() : $props.eps.data))
const comicStore = useComicStore()
</script>

<template>
  <div class="w-full flex flex-wrap justify-evenly">
    <StateContent :is-empty="$props.eps?.isEmpty" :is-error="$props.eps?.isError"
      :is-loading="$props.eps?.isLoading ?? true" retriable @retry="() => comicStore.now?.reloadEpsFromNet()"
      class="w-full !my-1">
      <div class="w-full text-sm text-[--van-text-color-2] pl-2 mt-1">
        <div class="h-5 flex items-center" @click="config['bika.info.unsortComic'] = !config['bika.info.unsortComic']">
          反向排序<van-icon name="exchange" /></div>
      </div>
      <VanButton type="primary" plain style="--width: calc(33vw - 8px);"
        class="!h-auto !min-h-[--van-button-default-height] w-[--width] my-1" v-for="ep of eps"
        @click="$router.force[mode](`/comic/${id}/read/${ep.order}`)" :disabled="ep.order == now">
        <div class="text-wrap w-[--width] break-words">{{ ep.title }}
        </div>
        <NTime format="yyyy-MM-dd" :time="ep.updated_time" class="!text-[--primary-color-light]" />
      </VanButton>
      <template v-if="eps">
        <div v-for="_index of eps.length % 3 == 0 ? 0 : eps.length == 1 ? 2 : 1" style="--width: calc(33vw - 8px);"
          class="!h-auto !min-h-[--van-button-default-height] w-[--width] my-1">
          <!-- placeholder block -->
        </div>
      </template>
    </StateContent>
  </div>
</template>