import { createRouter, createWebHistory } from "vue-router"
import { useAppStore } from "@/stores"
import {  isEmpty } from "lodash-es"
import Index from '@/pages/index.vue'
import Login from '@/pages/auth/login.vue'
import symbol from "@/symbol"
import { delay } from "@/utils/delay"
export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      redirect: isEmpty(localStorage.getItem(symbol.loginToken)) ? '/auth/login' : '/main/home'
    },
    {
      path: "/main/home",
      component: Index
    },
    {
      path: "/auth/login",
      component: Login
    }
  ]
})
const stopSetupWatch = router.afterEach(async () => {
  const el = document.getElementById('setup')
  if (!el) return stopSetupWatch()
  el.style.opacity = '0'
  await delay(300)
  el.remove()
})