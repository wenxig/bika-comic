import { createRouter, createWebHistory, isNavigationFailure, NavigationFailureType, type RouteLocationRaw } from "vue-router"
import { isEmpty } from "lodash-es"
import symbol from "@/symbol"
export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      redirect: isEmpty(localStorage.getItem(symbol.loginToken)) ? '/auth/login' : '/main/home'
    },{
      path: "/auth/login",
      component: () => import('@/pages/auth/login.vue')
    },
    {
      path: '/main',
      component: () => import('@/pages/main/index.vue'),
      redirect: '/main/home',
      children: [{
        path: 'home',
        component: () => import('@/pages/main/home/index.vue'),
        redirect: '/main/home/random',
        children: [{
          path: 'random',
          component: () => import('@/pages/main/home/random.vue'),
        }]
      }]
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

const $routerForceDo = async (mode: keyof typeof router.force, to: RouteLocationRaw) => { do var r = await router[mode](to); while (isNavigationFailure(r, NavigationFailureType.aborted)); return r }
router.force = {
  push: to => $routerForceDo('push', to),
  replace: to => $routerForceDo('replace', to),
}