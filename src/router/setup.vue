<script setup lang='ts'>
import symbol from '@/symbol'
import { useLocalStorage } from '@vueuse/core'
import { useRoute, useRouter } from 'vue-router'
const $router = useRouter()
const $route = useRoute()
const loginToken = useLocalStorage(symbol.loginToken, '')
const setup = () => $router.force.push(loginToken.value ? decodeURIComponent(($route.query.from ?? '/main/home').toString()) : '/auth/login')

</script>

<template>
  <template>{{ setup() }}</template>
</template>