<script setup lang='ts'>
import { useAppStore } from '@/stores';
import { isEmpty } from 'lodash-es';
const app = useAppStore()
</script>

<template>
  <List :item-height="160" reloadable @reload="then => app.$reload.me().then(then)"
    class="h-[calc(100vh-var(--van-tabs-line-height)-240px-var(--van-tabbar-height))]" :data="app.user?.favourite ?? []"
    :is-requesting="isEmpty(app.user)" v-slot="{ height, data: { item: comic } }">
    <ComicCard :comic :height />
  </List>
</template>