import { createApp, defineComponent, } from "vue"
import { createPinia } from "pinia"
import App from "./App.vue"
import { router } from "./router"
import "@/index.css"
import { NConfigProvider, NMessageProvider, NDialogProvider, NLoadingBarProvider, zhCN } from 'naive-ui'
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

const app = createApp(
  defineComponent(() => {
    return () => (
      <NConfigProvider locale={zhCN} abstract>
        <NLoadingBarProvider container-class="z-[200000]">
          <NDialogProvider to="#popups">
            <NMessageProvider max={5} to="#messages">
              <App />
            </NMessageProvider>
          </NDialogProvider>
        </NLoadingBarProvider>
      </NConfigProvider>
    )
  })
)

app.use(router)
const pinia = createPinia()
app.use(pinia)
app.mount("#app")
