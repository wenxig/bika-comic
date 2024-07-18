import { createApp } from "vue"
import { createPinia } from "pinia"
import { init } from "@/stores"
import App from "./App.vue"
import router from "./router"
import "@/index.scss"
import "@vant/touch-emulator"
import { NConfigProvider, GlobalThemeOverrides, NMessageProvider, NDialogProvider, NLoadingBarProvider, darkTheme, lightTheme, zhCN } from 'naive-ui'
import { isDark } from "./config"
import { ConfigProviderThemeVars } from 'vant'
import { reactiveComputed, useCssVar } from '@vueuse/core'

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

// provide
const app = createApp(
  <NConfigProvider themeOverrides={themeOverrides} class="h-full" locale={zhCN}>
    <NLoadingBarProvider container-class="z-[200000]">
      <NDialogProvider to="#popups">
        <van-config-provider themeVars class="h-full" theme={isDark ? 'dark' : 'light'} >
          <NMessageProvider max={5} to="#messages">
            <App />
          </NMessageProvider>
        </van-config-provider>
      </NDialogProvider>
    </NLoadingBarProvider>
  </NConfigProvider>
)

app.use(router)
const pinia = createPinia()
app.use(pinia)
init()
app.mount("#app")