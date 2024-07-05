<script setup lang="ts">
import { SpeedInsights } from "@vercel/speed-insights/vue"
import { ConfigProviderThemeVars } from 'vant'
import { GlobalThemeOverrides, NDialogProvider, NLoadingBarProvider, darkTheme, lightTheme, zhCN } from 'naive-ui'
import { reactiveComputed, useCssVar } from '@vueuse/core'
import App from './_App.vue'
import config, { baseConfig, isDark } from './config'
import { allPopups } from "./utils/layout"
import { getConfig, putConfig } from "./api/plusPlan"
import { defaultsDeep } from "lodash-es"
import { nextTick, watch } from "vue"
import { SmartAbortController } from "./utils/requset"
import symbol from "./symbol"

// theme setup
const themeColor = useCssVar('--primary-color')
const themeColorLight = useCssVar('--primary-color-hover')
const themeColorDark = useCssVar('--primary-color-pressed')
const themeVars = reactiveComputed(() => ({
  primaryColor: themeColor.value,
} satisfies ConfigProviderThemeVars))
const themeOverrides = reactiveComputed(() => ({
  common: {
    ...(isDark.value ? darkTheme.common : lightTheme.common),
    primaryColor: themeVars.primaryColor,
    primaryColorHover: themeColorLight.value,
    primaryColorPressed: themeColorDark.value,
    primaryColorSuppl: themeColorDark.value
  }
} satisfies GlobalThemeOverrides))

// config setup
let isSetup = true
if (isSetup) getConfig().then(async v => {
  if (!v) return
  localStorage.setItem(symbol.config, JSON.stringify(v))
  config.value = defaultsDeep(v, baseConfig)
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
watch(config, ({ value: config }, { value: oldConfig }) => {
  console.log('change config')
  if (isSetup) return
  if (config['bika.plusPlan']) {
    stop.abort()
    putConfig(config, { signal: stop.signal })
  }
  if (config['bika.darkMode'] != oldConfig['bika.darkMode']) loadTheme()
  localStorage.setItem(symbol.config, JSON.stringify(config))
})
</script>

<template>
  <SpeedInsights />
  <NConfigProvider :themeOverrides class="h-full" :locale="zhCN">
    <NLoadingBarProvider container-class="z-[200000]">
      <NDialogProvider to="#popups">
        <van-config-provider :themeVars class="h-full" :theme="isDark ? 'dark' : 'light'">
          <NMessageProvider :max="5" to="#messages">
            <App />
          </NMessageProvider>
        </van-config-provider>
      </NDialogProvider>
    </NLoadingBarProvider>
  </NConfigProvider>
</template>

