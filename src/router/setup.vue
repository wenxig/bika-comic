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
    console.log(path)
    $router.force.push({
      path: path == '/' ? loginToken.value ? '/main/home' : '/auth/login' : path,
      query,
      hash: hash.substring(1)
    })
    isShowSetupPage.value = true
  }
}
setup()
</script>

<template>
</template>