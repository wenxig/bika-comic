import { createRouter, createWebHistory } from "vue-router"
import { isEmpty } from "lodash-es"
import symbol from "@/symbol"
export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      redirect: isEmpty(localStorage.getItem(symbol.loginToken)) ? '/auth/login' : '/main/home'
    },
    {
      path: "/main/home",
      component: () => import('@/pages/index.vue')
    },
    {
      path: "/auth/login",
      component: () => import('@/pages/auth/login.vue')
    }
  ]
})
const stopSetupWatch = router.afterEach(() => {
  const { promise, resolve } = Promise.withResolvers<void>()
  const el = document.getElementById('setup')
  if (!el) return stopSetupWatch()
  el.animate([
    { opacity: 1 },
    { opacity: 0 }
  ], {
    duration: 300,
    iterations: Infinity,
    easing: 'cubic-bezier(0, 0, 0.2, 1)'
  }).addEventListener('finish', () => {
    el.remove()
    resolve()
  })
  el.remove()
  return promise
})