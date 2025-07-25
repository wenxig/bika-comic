<script setup lang='ts' generic="T extends string">
import { createReusableTemplate } from '@vueuse/core'
import { shallowRef } from 'vue'
const $props = defineProps<{
  itemNames: T[],
  default: T,
  routerBase: string
}>()
const name = shallowRef('')
const [DefineTemplate, ReuseTemplate] = createReusableTemplate<{
  item: T
}>()
defineSlots<{
  default(arg: { Item: typeof ReuseTemplate, item: T }): any
}>()
</script>

<template>
  <DefineTemplate v-slot="{ item }">
    <VanTabbarItem :name="item">主页</VanTabbarItem>
  </DefineTemplate>
  <VanTabbar class="fixed bottom-0 transition-[opacity] opacity-100 w-full" :model-value="name"
    @change="v => $router.replace(`/main/${v}`)">
    <slot :Item="ReuseTemplate" v-for="item of itemNames" :item></slot>
  </VanTabbar>
</template>