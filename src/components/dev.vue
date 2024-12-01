<script setup lang='ts'>
import Popup from '@/components/popup.vue'
import config, { isDark } from '@/config'
import {  useAppStore } from '@/stores'
import { flatten, isArray, isBoolean, isError, isFunction, isMap, isNil, isNumber, isObject, isSet, isString } from 'lodash-es'
import { shallowReactive, shallowRef, watch } from 'vue'
import VueJsonPretty from 'vue-json-pretty'
import type { JSONDataType } from 'vue-json-pretty/types/utils'
const app = useAppStore()
const $window = window
const devPreviewData = shallowRef<JSONDataType>('')
const devShowPreview = shallowRef(false)
const openJsonPerview = (value: JSONDataType) => {
  if (isSet(value) || isMap(value)) value = value.toJSONObject()
  devPreviewData.value = value
  devShowPreview.value = true
}
type MessageBlocks = unknown[]
const errorProcesser = (error: Error) => error.stack ? [error.stack] : [`${error.name}: ${error.message}`]
const linesProcesser = (value: MessageBlocks) => {
  const v = flatten(value.map(v => isString(v) ? v.split(/(?=\n)/g) : isArray(v) ? [v] : v))
  const nv: MessageBlocks[] = [[]]
  for (const element of v) {
    if (isString(element) && element.includes('\n')) {
      nv.push([element])
    } else {
      nv.at(-1)?.push(element)
    }
  }
  return nv
}
const all = shallowReactive<{ value: MessageBlocks, type: 'log' | 'error' | 'warn', id: number }[]>([])
const baseLogFunction = window.console.log
const baseInfoFunction = window.console.info
const baseErrorFunction = window.console.error
const baseWarnFunction = window.console.error
const baseDebugFunction = window.console.debug
watch(() => config.value['bika.devMode'], devMode => {
  console.log('devmode change', devMode)
  if (devMode) {
    window.console.log = (...value) => {
      baseLogFunction(...value)
      const id = all.length
      linesProcesser(value).forEach(value => all.push({ value, type: 'log', id }))
    }
    window.console.info = (...value) => {
      baseInfoFunction(...value)
      const id = all.length
      linesProcesser(value).forEach(value => all.push({ value, type: 'log', id }))
    }
    window.console.debug = (...value) => {
      baseDebugFunction(...value)
      const id = all.length
      linesProcesser(value).forEach(value => all.push({ value, type: 'log', id }))
    }
    window.console.error = (...value) => {
      baseErrorFunction(...value)
      const id = all.length
      linesProcesser(isError(value[0]) ? errorProcesser(value[0]) : value).forEach(value => all.push({ value, type: 'log', id }))
    }
    window.console.warn = (...value) => {
      baseWarnFunction(...value)
      const id = all.length
      linesProcesser(value).forEach(value => all.push({ value: value, type: 'warn', id }))
    }
  } else {
    window.console.log = baseLogFunction
    window.console.info = baseInfoFunction
    window.console.error = baseErrorFunction
    window.console.warn = baseWarnFunction
    window.console.debug = baseDebugFunction
  }
}, { immediate: true })
window.addEventListener('error', ({ error }) => {
  window.console.error(error)
})
const getName = (v: object) => v.constructor.name
</script>

<template>
  <template v-if="config['bika.devMode']">
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
        <van-tab title="控制台" name="log" class="!h-full w-full overflow-hidden">
          <List item-resizable :end="false" :isRequesting="false" :data="all" :item-height="20" go-bottom
            v-slot="{ data: { item: { value: v, type, id }, index }, height }"
            class="h-[calc(80vh-60px)] w-[100vw] !overflow-x-hidden">
            <div
              class="flex flex-nowrap text-[11px] font-mono *:inline-flex *:items-center *:ml-1 text-nowrap w-full overflow-y-hidden nos"
              :style="{ height: `${height}px` }" :class="[all[index - 1]?.id != id && 'van-hairline--top', all[index + 1]?.id != id && 'van-hairline--bottom',
              type == 'error' && 'bg-red-100 bg-opacity-80', type == 'warn' && 'bg-yellow-100 bg-opacity-80']">
              <template v-if="(isString(v[0]) && !v[0].includes('%c')) || !isString(v[0])">
                <template v-for="value of v">
                  <div v-if="isBoolean(value)" class="text-blue-700">{{ value }}</div>
                  <div v-else-if="isString(value)" class="text-[--van-text-color]">{{ value.replaceAll(' ', '&nbsp;') }}
                  </div>
                  <div v-else-if="isNumber(value)" class="text-blue-700">{{ value }}</div>
                  <div v-else-if="isNil(value)" class="text-gray-400">{{ String(value) }}</div>
                  <div v-else-if="isFunction(value)" class="text-blue-600">f(...){...}</div>
                  <div v-else-if="isArray(value)" @click="openJsonPerview(value)"
                    class="font-semibold underline rounded van-haptics-feedback italic text-[--van-text-color]">
                    &nbsp;({{ value.length }})&nbsp;Array&nbsp;
                  </div>
                  <div v-else-if="isObject(value)" @click="openJsonPerview(<JSONDataType>value)"
                    class="font-semibold underline rounded van-haptics-feedback italic text-[--van-text-color]">&nbsp;
                    Object[{{ getName(value) }}]
                    &nbsp;
                  </div>
                </template>
              </template>
              <template v-else-if="isString(v[0])">
                <!-- split会产生空块，抵消了index+1 -->
                <Var :value="v[index] ?? v.at(-1)" v-slot="{ value }" v-for="(style, index) of v[0].split('%c')">
                  <div class="text-[--van-text-color]" :style="[isString(style) && style]">
                    {{ value }}
                  </div>
                </Var>
              </template>
              <template v-else>
                [[unknown data]]
              </template>
            </div>
          </List>
        </van-tab>
      </VanTabs>
    </Popup>
    <Popup position="center" closeable class="w-[90vw] h-[90vh]" round v-model:show="devShowPreview">
      <VueJsonPretty :deep="1" :theme="isDark ? 'dark' : 'light'" showIcon virtual class="w-full h-full"
        :height="$window.innerHeight * 0.9" v-if="isObject(devPreviewData)" :data="devPreviewData" />
    </Popup>
  </template>
</template>
<style scoped lang='scss'>
.nos {
  scrollbar-width: none;
}
</style>