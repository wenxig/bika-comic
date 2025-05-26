<script setup lang='ts'>
import { spiltAnthors } from '@/utils/translater'
import { computed } from 'vue'

const $props = defineProps<{
  anthorsString?: string
}>()
const ahthors = computed(() => spiltAnthors($props.anthorsString))
defineEmits<{
  select: [name: string]
}>()
</script>

<template>
  <div class="text-[--van-primary-color] *:text-nowrap flex flex-wrap">
    <span>作者:&nbsp;</span>
    <span v-for="author of ahthors" class="mr-2 van-haptics-feedback underline"
      @click="$emit('select', author)">{{ author }}</span>
  </div>
</template>