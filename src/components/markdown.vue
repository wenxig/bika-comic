<script setup lang='ts'>
import { parse } from 'marked'
import typo from '@/assets/style/typo.scss?url'
import { computed } from 'vue'
const $props = defineProps<{
  text: string,
  onStyle?: boolean
}>()
const html = computed(() => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
  <link rel="stylesheet" href="${typo}">
</head>
<body>
  <div class="typo">
    ${parse($props.text)}
  </div>
</body>
</html>
`)
</script>

<template>
  <iframe :srcdoc="html" frameborder="0"></iframe>
</template>
<style scoped lang='scss'>
.markdown-box:not(.md) * {
  margin: 0 !important;
}
</style>