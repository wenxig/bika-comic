<script setup lang='ts'>
import { isNumber } from 'lodash-es';
import { computed } from 'vue';

const $props = withDefaults(defineProps<{
  text?: string
  ellipsis?: number
}>(), {
  text: ''
})
const texts = computed(() => $props.text.replace(/(http(s?):\/\/)?([\w-]+\.)+(\.?[a-z]+)+(:\d+)?(\/[\w-.\/?%&=]*)?/ig, v => `\u1145[[${v}]]\u1145`).split('\u1145').filter(Boolean).map(v => /\[\[[^\[\]]+\]\]/g.test(v) ? {
  value: v.substring(2, v.length - 2),
  mode: 'link'
} as const : {
  value: v,
  mode: 'text'
} as const));
</script>

<template>
  <div class="inline-flex flex-col text-wrap text-[--van-text-color]">
    <span :class="[isNumber(ellipsis) && 'overflow-ellipsis overflow-hidden']"
      :style="[isNumber(ellipsis) && `line-break: anywhere;display: -webkit-box;-webkit-box-orient: vertical;-webkit-line-clamp: ${ellipsis};`]"
      class="whitespace-pre-wrap">
      <template v-for="token of texts">
        <a class="text-[--p-color] van-haptics-feedback underline" @click.stop
          :href="/http(s?):\/\/.+/.test(token.value) ? token.value : `https://${token.value}`"
          v-if="token.mode == 'link'" target="_blank">{{ token.value }}</a>
        <template v-else-if="token.mode == 'text'">{{ token.value }}</template>
      </template>
    </span>
  </div>
</template>