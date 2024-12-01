<script setup lang="ts">
import { SpeedInsights } from "@vercel/speed-insights/vue"
import config, { isOnline } from './config'
import { UserConfig } from "./api/plusPlan"
import { nextTick, watch, shallowRef, provide } from "vue"
import { SmartAbortController } from "./utils/requset"
import symbol from "./symbol"
import { MessageReactive, useDialog, useLoadingBar, useMessage } from 'naive-ui'
import Text from '@/components/text.vue'
import { createLoadingMessage } from './utils/message'
import 'vue-json-pretty/lib/styles.css'
import { getVer } from './api/plusPlan'
import Popup from '@/components/popup.vue'
import Dev from '@/components/dev.vue'
import packageJson from '../package.json'
import eventBus from "./utils/eventBus"
window.$message = useMessage()
window.$loading = useLoadingBar()
window.$dialog = useDialog()
const ver = shallowRef('')
getVer().then(latestVersion => {
  ver.value = latestVersion
  showUpdatePopup.value = !import.meta.env.DEV && latestVersion != packageJson.version
})
const showUpdatePopup = shallowRef(false)
const isUpdateing = shallowRef(false)
async function update() {
  isUpdateing.value = true
  const loading = createLoadingMessage('更新中')
  try {
    const sws = await navigator.serviceWorker.getRegistrations()
    await Promise.all(sws.map(sw => sw.unregister()))
    const allCacheKeys = await caches.keys()
    await Promise.all(allCacheKeys.map(key => caches.delete(key)))
    await loading.success(undefined, 300)
    location.reload()
  } catch {
    loading.fail()
  }
  isUpdateing.value = false
}
let onLineMessage: MessageReactive | undefined = undefined
watch(isOnline, isOnline => {
  if (isOnline) onLineMessage?.destroy()
  else onLineMessage = window.$message.info('尚未接入互联网')
}, { immediate: true })

let isSetup = true
if (isSetup) UserConfig.getFromNet().then(async v => {
  if (!v) return
  localStorage.setItem(symbol.config, JSON.stringify(config.value = v))
  await nextTick()
  isSetup = false
})
const loadTheme = () => {
  const el = document.querySelector<HTMLMetaElement>("meta[name=theme-color]")
  el?.setAttribute('content', window.getComputedStyle(document.body).getPropertyValue('--van-background-2'))
}
document.addEventListener('DOMContentLoaded', () => {
  loadTheme()
})
const stop = new SmartAbortController()
watch(config, (config, oldConfig) => {
  console.log('change config', config)
  if (isSetup) return
  if (config['bika.plusPlan']) {
    stop.abort()
    UserConfig.update(config, { signal: stop.signal })
  }
  if (config['bika.darkMode'] != oldConfig['bika.darkMode']) loadTheme()
  localStorage.setItem(symbol.config, JSON.stringify(config))
}, { deep: true })

eventBus.on('networkError', ([cause]) => [
  window.$message?.error('网络错误:' + cause)
])
</script>

<template>
  <SpeedInsights />
  <Suspense>
    <RouterView v-slot="{ Component, route }"
      :key="(($route.path.includes('/read')) ? $route.path : ($route.path.includes('/search') ? `${$route.query.mode}${$route.query.keyword}` : undefined))">
      <div class="h-full w-full" :key="route.path">
        <component :is="Component" />
      </div>
    </RouterView>
  </Suspense>
  <Popup position="center" round v-model:show="showUpdatePopup" class="w-[70%] h-[80vw] p-3">
    <div class="text-[--p-color] font-bold text-xl">发现新版本</div>
    <Text :text="'v' + ver" />
    <Text text="强烈建议更新，否则可能会因为服务器协议更新而产生冲突。因冲突引发的后果用户自行承担。" class="w-full" />
    <VanButton type="primary" :disabled="isUpdateing" :loading="isUpdateing"
      class="absolute bottom-3 w-[calc(100%-24px)] left-3" size="small" block @click="update()" loading-text="加载中...">
      更新
    </VanButton>
  </Popup>
  <Teleport to="#small-window">
    <SmallWindow />
  </Teleport>
  <VanImagePreview :show="false" v-once />
  <Dev />
</template>