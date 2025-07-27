<script setup lang='ts' generic="T extends {
  name: string,
  title: string
}">
import { useRoute, useRouter } from 'vue-router'
const $props = defineProps<{
  items: T[],
  routerBase: string,
}>()
const $route = useRoute()
const defaultRouter = $route.path.replaceAll($props.routerBase, '').replace(/^\//, '')
const select = defineModel<T['name']>()
defineSlots<{
  default(arg: { itemName: T }): any
}>()
const $router = useRouter()
const beforeChange = async () => {
  await $router.force.replace(`${$props.routerBase}/${select.value}`)
  return true
}
</script>

<template>
  <VanTabs shrink animated v-model:active="select" :beforeChange class="w-full">
    <VanTab v-for="item of items" :title="item.title" :name="item.name"></VanTab>
  </VanTabs>
</template>