import { createRouter, createWebHistory, type RouteLocationRaw, isNavigationFailure, NavigationFailureType } from "vue-router"
import { isEmpty, noop } from "lodash-es"
import { getComicEps, getComicInfo, getComicLikeOthers, } from '@/api'
import { useComicStore } from "@/stores/comic"
import { SmartAbortController } from "@/utils/requset"
import { AxiosError, isCancel } from "axios"
import { useGameStore } from "@/stores/game"
import { getGameInfo } from "@/api/game"
import { useAppStore } from "@/stores"
import symbol from "@/symbol"
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      redirect: localStorage.getItem(symbol.loginToken) ? '/main/home' : '/auth/login'
    }, {
      path: '/auth/login',
      component: () => import('@/page/auth/login.vue'),
    }, {
      path: '/auth/signup',
      component: () => import('@/page/auth/signup.vue'),
    }, {
      path: '/main',
      component: () => import('@/page/main/index.vue'),
      redirect: '/main/home',
      children: [{
        path: 'home',
        component: () => import('@/page/main/home/index.vue'),
        redirect: '/main/home/random',
        children: [{
          path: 'random',
          component: () => import('@/page/main/home/random.vue'),
        }, {
          path: 'level',
          component: () => import('@/page/main/home/level/index.vue'),
          redirect: '/main/home/level/day',
          children: [{
            path: 'user',
            component: () => import('@/page/main/home/level/userTotel.vue'),
          }, {
            path: ':path(day|week|month)',
            component: () => import('@/page/main/home/level/comicTotel.vue'),
          }]
        }, {
          path: 'find',
          component: () => import('@/page/main/home/find.vue'),
        }, {
          path: ':name',
          component: () => import('@/page/main/home/provide.vue')
        }]
      }, {
        path: 'user',
        component: () => import('@/page/main/user/index.vue'),
      }, {
        path: 'subscribe',
        component: () => import('@/page/main/subscribe.vue'),
      }, {
        path: 'chat',
        component: () => import('@/page/main/chat/index.vue'),
        redirect: '/main/chat/room',
        children: [{
          path: 'room',
          component: () => import('@/page/main/chat/room.vue'),
        }]
      }, {
        path: 'find',
        component: () => import('@/page/main/home/find.vue'),
      }, {
        path: ':name',
        component: () => import('@/page/main/home/provide.vue')
      }]
    }, {
      path: '/user/history',
      component: () => import('@/page/main/user/history.vue'),
    }, {
      path: '/user/favourt',
      component: () => import('@/page/main/user/favourt.vue'),
    }, {
      path: '/user/image',
      component: () => import('@/page/main/user/fimage/index.vue'),
    }, {
      path: '/user/image/read',
      component: () => import('@/page/main/user/fimage/read.vue'),
    }, {
      path: '/user/comment',
      component: () => import('@/page/main/user/comment.vue'),
    }, {
      path: '/user/edit',
      component: () => import('@/page/main/user/edit.vue'),
    }, {
      path: '/setting',
      component: () => import('@/page/setting.vue'),
    }, {
      path: '/search',
      component: () => import('@/page/search.vue'),
    }, {
      path: '/game',
      component: () => import('@/page/game/index.vue'),
    }, {
      path: '/game/:id',
      component: () => import('@/page/game/about/index.vue'),
      redirect: f => ({ name: 'gameInfo', params: f.params, query: f.query, hash: f.hash }),
      children: [{
        path: 'info',
        name: 'gameInfo',
        component: () => import('@/page/game/about/info.vue'),
      }, {
        path: 'comments',
        component: () => import('@/page/game/about/comment.vue'),
      }]
    }, {
      path: '/comic/:id',
      redirect: f => ({ name: 'comicInfo', params: f.params, query: f.query, hash: f.hash }),
      component: () => import('@/page/comic/index.vue'),
      children: [{
        path: 'info',
        name: 'comicInfo',
        component: () => import('@/page/comic/info.vue'),
      }, {
        path: 'comments',
        component: () => import('@/page/comic/comments.vue'),
      }]
    }, {
      path: '/chat/room/:id',
      component: () => import('@/page/chat/room.vue')
    }, {
      path: '/comic/:id/read/:ep',
      component: () => import('@/page/comic/read.vue')
    }, {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})
// const stopSetup = router.beforeEach(to => {
//   stopSetup()
//   return { path: '/', query: { from: encodeURIComponent(to.fullPath) }, replace: true }
// })


let toFullPath: string
router.beforeEach((to, from) => {
  if (from.path != to.path) {
    window.$loading.start()
    toFullPath = to.fullPath
  }
})
router.beforeEach(to => {
  const app = useAppStore()
  if (to.path.includes('/main/home') && !!to.params.name && !app.collections_list.find(v => v.title == to.params.name as string)) return '/'
})

router.afterEach(() => window.$loading.finish())
router.onError(err => {
  if (err instanceof AxiosError && err.response) return window.$loading.finish()
  if (location.pathname.includes('auth')) return window.$loading.finish()
  window.$message.error('路由错误，尝试强制跳转')
  window.$loading.error()
  if (!import.meta.env.DEV) location.href = `${origin}${toFullPath}`
})


const comicAbort = new SmartAbortController()
router.beforeEach((to, from) => {
  comicAbort.abort()
  if (!(to.path.startsWith('/comic') && !isEmpty(to.params.id))) return true
  try {
    const comicStore = useComicStore()
    const id = to.params.id.toString()
    const setupOthers = () => {
      if (comicStore.comic.preload?._id != id) comicStore.$clear()
      if (isEmpty(comicStore.comic.comic)) getComicInfo(id, { signal: comicAbort.signal }).then(info => comicStore.$setComic(info)).catch(noop)
      if (from.path.startsWith('/comic') && from.path.endsWith('/info')) comicStore.$load(comicStore.lastsComics.get(id)!)
      if (comicStore.comic.eps.id != id) getComicEps(id, { signal: comicAbort.signal }).then(eps => comicStore.comic.eps = eps).catch(noop)
      if (comicStore.comic.likeComic?.id != id) getComicLikeOthers(id, { signal: comicAbort.signal }).then(likes => comicStore.comic.likeComic = likes).catch(noop)
    }
    console.log('comic load worker', to.path, to.path.startsWith('/comic') && to.path.endsWith('/info'))

    if (to.path.startsWith('/comic') && to.path.endsWith('/info')) {
      console.log('load comic')
      if (comicStore.lastsComics.get(id)) {
        console.log('load comic sync')
        comicStore.$load(comicStore.lastsComics.get(id)!)
        setupOthers()
      }
      else {
        console.log('load comic async')
        getComicInfo(id, { signal: comicAbort.signal }).then(comic => {
          comicStore.$setupComic(comic)
          setupOthers()
          console.log('load comic async done')
        })
      }
    }
  } catch (error) {
    console.error(error)
    if (!isCancel(error)) throw error
  }
  return true
})

const gameAbort = new SmartAbortController()
router.beforeEach(async (to) => {
  gameAbort.abort()
  if (!(to.path.startsWith('/game') && !isEmpty(to.params.id))) return true
  try {
    const gameStore = useGameStore()
    const id = to.params.id.toString()
    if (isEmpty(gameStore.game.preload)) gameStore.$setupGame(await getGameInfo(id, { signal: gameAbort.signal }))
    if (gameStore.game.preload._id != id) gameStore.$setupGame(await getGameInfo(id, { signal: gameAbort.signal }))
    else if (isEmpty(gameStore.game.game)) gameStore.game.preload.getInfo({ signal: gameAbort.signal }).then(info => gameStore.$setGame(info)).catch(noop)
  } catch (error) {
    if (!isCancel(error)) throw error
  }
  return true
})

const $routerForceDo = async (mode: 'push' | 'replace', to: RouteLocationRaw) => { do var r = await router[mode](to); while (isNavigationFailure(r, NavigationFailureType.aborted)); return r }
router.force = {
  push: to => $routerForceDo('push', to),
  replace: to => $routerForceDo('replace', to),
}
export default router