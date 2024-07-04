<script setup lang='ts'>
import { MessageReactive, useDialog, useLoadingBar, useMessage } from 'naive-ui'
import Text from '@/components/text.vue'
import { shallowRef, watch } from 'vue'
import { createLoadingMessage } from './utils/message'
import { isEmpty, isNumber, isString } from 'lodash-es'
import 'vue-json-pretty/lib/styles.css'
import VueJsonPretty from 'vue-json-pretty'
import { DevData, useAppStore } from './stores'
import config, { isDark, isOnline } from './config'
import { getVer } from './api/plusPlan'
import Popup from '@/components/popup.vue'
window.$message = useMessage()
window.$loading = useLoadingBar()
window.$dialog = useDialog()
const app = useAppStore()
const ver = shallowRef('')
getVer().then(v => {
  ver.value = v
  if (isEmpty(localStorage.getItem('version'))) localStorage.setItem('version', v)
  showUpdatePopup.value = !import.meta.env.DEV && (!isEmpty(localStorage.getItem('version')) && v != localStorage.getItem('version'))
})
const showUpdatePopup = shallowRef(false)
const isUpdateing = shallowRef(false)
async function update() {
  isUpdateing.value = true
  const loading = createLoadingMessage('更新中')
  try {
    const sws = await navigator.serviceWorker.getRegistrations()
    await Promise.all(sws.map(sw => sw.unregister())) // 40
    const allCacheKeys = await caches.keys()
    await Promise.all(allCacheKeys.map(key => caches.delete(key))) // 100
    localStorage.setItem('version', ver.value)
    await loading.success(undefined, 300)
    location.reload()
  } catch {
    loading.fail()
  }
  isUpdateing.value = false
}
const isText = (v: unknown): v is (string | number) => isNumber(v) || isString(v)
const $window = window

const devPreviewData = shallowRef<DevData['data'][number]>('')
const devShowPreview = shallowRef(false)

const baseLogFunction = window.console.log
if (!import.meta.env.DEV) watch(() => config.value['bika.devMode'], devMode => {
  if (devMode) {
    window.console.log = (...v) => {
      const app = useAppStore()
      const base = app.devData.get('log') ?? {
        name: 'console.log',
        data: []
      }
      base.data.push(v.join(' '))
      app.devData.set('log', base)
    }
  } else {
    window.console.log = baseLogFunction
  }
}, { immediate: true })

let onLineMessage: MessageReactive | undefined = undefined
watch(isOnline, isOnline => {

  if (isOnline) onLineMessage?.destroy()
  else onLineMessage = window.$message.info('尚未接入互联网')
}, { immediate: true })

</script>

<template>
  <Suspense>
    <router-view
      :key="(($route.path.includes('/read/')) ? $route.path : ($route.path.includes('/search') ? `${$route.query.mode}${$route.query.keyword}` : undefined))" />
  </Suspense>
  <Popup position="center" round v-model:show="showUpdatePopup" class="w-[70%] h-[80vw] p-3">
    <div class="text-[--p-color] font-bold text-xl">发现新版本</div>
    <Text :text="'v' + ver" />
    <Text text="强烈建议更新，否则可能会因为服务器协议更新而产生冲突。因冲突引发的后果用户自行承担。" class="w-full" />
    <VanButton type="primary" :disabled="isUpdateing" :loading="isUpdateing"
      class="absolute bottom-3 w-[calc(100%-24px)] left-3" size="small" block @click="update()" loading-text="加载中...">更新
    </VanButton>
  </Popup>

  <!-- dev -->
  <template v-if="config.value['bika.devMode']">
    <VanFloatingBubble axis="xy" v-if="!$route.path.includes('/read')" id="dev-button" @click="app.showDevPupop = true"
      style="z-index: 114514;color: #fff;">
      <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32"
        class="w-10 block text-white">
        <path d="M31 16l-7 7l-1.41-1.41L28.17 16l-5.58-5.59L24 9l7 7z" fill="currentColor"></path>
        <path d="M1 16l7-7l1.41 1.41L3.83 16l5.58 5.59L8 23l-7-7z" fill="currentColor"></path>
        <path d="M12.419 25.484L17.639 6l1.932.518L14.35 26z" fill="currentColor"></path>
      </svg>
    </VanFloatingBubble>
    <Popup v-model:show="app.showDevPupop" position="bottom" round class="h-[80vh] overflow-hidden">
      <VanTabs class="!h-full w-full overflow-hidden">
        <van-tab v-for="c of app.devData.values()" :title="c.name" :name="c.name"
          class="!h-full w-full overflow-hidden">
          <List item-resizable :end="false" :isRequesting="false" :data="c.data.map(value => ({ value })).toReversed()"
            :item-height="44" v-slot="{ data: { item: { value: v } } }" class="h-[80vh]">
            <VanCell :title="isText(v) ? 'text' : 'json'" is-link
              @click="() => { devPreviewData = v; devShowPreview = true }">
              {{ isText(v) ? v : '' }}
            </VanCell>
          </List>
        </van-tab>
      </VanTabs>
    </Popup>
    <Popup position="center" closeable class="w-[90vw] h-[90vh]" round v-model:show="devShowPreview">
      <VueJsonPretty :deep="1" :theme="isDark ? 'dark' : 'light'" showIcon virtual class="w-full h-full"
        :height="$window.innerHeight * 0.9" :data="devPreviewData" />
    </Popup>
  </template>
  <!-- 导入css -->
  <template v-once v-if="false">
    <VanImagePreview :show="false" />
    <VanDialog :show="false" />
  </template>
</template>