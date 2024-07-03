<script setup lang="ts">
import { SpeedInsights } from "@vercel/speed-insights/vue"
import { ConfigProviderThemeVars } from 'vant'
import { GlobalThemeOverrides, NDialogProvider, NLoadingBarProvider, darkTheme, lightTheme, zhCN } from 'naive-ui'
import { reactiveComputed, useCssVar } from '@vueuse/core'
import App from './_App.vue'
import { isDark } from './config'
import { allPopups } from "./utils/layout"
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

</script>

<template>
  <SpeedInsights />
  <NConfigProvider :themeOverrides class="h-full" :locale="zhCN">
    <NLoadingBarProvider container-class="z-[200000]">
      <NDialogProvider to="#messages" >
        <van-config-provider :themeVars class="h-full" :theme="isDark ? 'dark' : 'light'">
          <NMessageProvider :max="5" to="#messages" :container-style="{ zIndex: (allPopups + 2) * 1000 }">
            <App />
          </NMessageProvider>
        </van-config-provider>
      </NDialogProvider>
    </NLoadingBarProvider>
  </NConfigProvider>
</template>
