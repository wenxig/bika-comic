<script setup lang='ts'>
import symbol from '@/symbol'
import { useLocalStorage } from '@vueuse/core'
import { onActivated, onMounted } from 'vue'
import { useRouter } from 'vue-router'
const $router = useRouter()
const loginToken = useLocalStorage(symbol.loginToken, '')
const setup = () => $router.force.push(loginToken.value ? '/main/home' : '/auth/login')
onMounted(setup)
onActivated(setup)
</script>

<template>

</template>