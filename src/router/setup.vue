<script setup lang='ts'>
import { isShowSetupPage } from '@/stores/temp'
import symbol from '@/symbol'
import { useLocalStorage } from '@vueuse/core'
import { useRoute, useRouter } from 'vue-router'
const $router = useRouter()
const $route = useRoute()
const loginToken = useLocalStorage(symbol.loginToken, '')

const setup = async () => {
  console.log('isShowSetupPage.value', isShowSetupPage.value)

  if (isShowSetupPage.value) $router.back()
  else {
    const { path, query, hash } = $router.resolve(loginToken.value ? decodeURIComponent(($route.query.from || '/main/home').toString()) : '/auth/login')
    $router.force.push({
      path: path == '/' ? loginToken.value ? '/main/home' : '/auth/login' : path,
      query,
      hash,
      force: true,
    })
    isShowSetupPage.value = true
  }
}

</script>

<template>
  {{ void setup() }}
</template>