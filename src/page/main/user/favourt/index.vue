<script setup lang='ts'>
import { useAppStore } from '@/stores'
import { isEmpty } from 'lodash-es'
const app = useAppStore()
</script>

<template>
  <VanNavBar title="我的收藏" left-text="返回" left-arrow @click-left="$router.back()" />
  <List :item-height="160" reloadable @reload="then => app.$reload.me().then(then)" class="h-[calc(100%-46px)] w-full"
    :data="app.user?.favourite ?? []" :is-requesting="isEmpty(app.user)" v-slot="{ height, data: { item: comic } }">
    <ComicCard :comic :height />
  </List>
</template>