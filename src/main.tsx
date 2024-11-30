import { computed, createApp, defineComponent, } from "vue"
import { createPinia } from "pinia"
import { init } from "@/stores"
import App from "./App.vue"
import router from "./router"
import "@/index.scss"
import "@vant/touch-emulator"
import { NConfigProvider, GlobalThemeOverrides, NMessageProvider, NDialogProvider, NLoadingBarProvider, darkTheme, lightTheme, zhCN } from 'naive-ui'
import { isDark } from "./config"
import { ConfigProviderThemeVars, ConfigProvider as VanConfigProvider } from 'vant'
import { reactiveComputed, useCssVar } from '@vueuse/core'
import { setupRequestProxy } from "./utils/requset"
Map.prototype.toJSON = function () {
  return JSON.stringify([...this.entries()])
}
Set.prototype.toJSON = function () {
  return JSON.stringify([...this.values()])
}
Map.prototype.toJSONObject = function () {
  return [...this.entries()]
}
Set.prototype.toJSONObject = function () {
  return [...this.values()]
}
console.only = window.console.log
const rawDecodeURIComponent = window.decodeURIComponent
window.decodeURIComponent = (url: string) => {
  do {
    url = rawDecodeURIComponent(url)
  } while (url.includes('%'))
  return url
}
const rawDecodeURI = window.decodeURI
window.decodeURI = (url: string) => {
  do {
    url = rawDecodeURI(url)
  } while (url.includes('%'))
  return url
}
setupRequestProxy()

const app = createApp(
  defineComponent(() => {
    const themeColor = useCssVar('--primary-color')
    const themeColorLight = useCssVar('--primary-color-hover')
    const themeColorDark = useCssVar('--primary-color-pressed')
    const themeVars = reactiveComputed<ConfigProviderThemeVars>(() => ({
      primaryColor: themeColor.value,
    }))
    const themeOverrides = reactiveComputed<GlobalThemeOverrides>(() => ({
      common: {
        ...(isDark.value ? darkTheme.common : lightTheme.common),
        primaryColor: themeVars.primaryColor,
        primaryColorHover: themeColorLight.value,
        primaryColorPressed: themeColorDark.value,
        primaryColorSuppl: themeColorDark.value
      }
    }))
    const themeString = computed(() => isDark.value ? 'dark' : 'light')
    return () => (
      <NConfigProvider themeOverrides={themeOverrides} locale={zhCN} abstract>
        <NLoadingBarProvider container-class="z-[200000]">
          <NDialogProvider to="#popups">
            <VanConfigProvider themeVars={themeVars} class="h-full" theme={themeString.value} >
              <NMessageProvider max={5} to="#messages">
                <App />
              </NMessageProvider>
            </VanConfigProvider>
          </NDialogProvider>
        </NLoadingBarProvider>
      </NConfigProvider>
    )
  })
)

app.use(router)
const pinia = createPinia()
app.use(pinia)
init()
app.mount("#app")
