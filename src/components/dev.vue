<script setup lang='ts'>
import Popup from '@/components/popup.vue'
import config, { isDark } from '@/config'
import { DevData, useAppStore } from '@/stores'
import { isBoolean, isNumber, isString } from 'lodash-es'
import { shallowRef, watch } from 'vue'
const app = useAppStore()
const isText = (v: unknown): v is (string | number | boolean) => isNumber(v) || isString(v) || isBoolean(v)
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
    app.devData.clear()
    window.console.log = baseLogFunction
  }
}, { immediate: true })
</script>

<template>
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
</template>