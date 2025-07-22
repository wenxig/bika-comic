import { createApp, defineComponent, } from "vue"
import { createPinia } from "pinia"
import App from "./App.vue"
import { router } from "./router"
import "@/index.css"
import { NConfigProvider, NMessageProvider, NDialogProvider, NLoadingBarProvider, zhCN } from 'naive-ui'
Map.prototype.toJSON = function () {
  return ([...this.entries()])
}
Set.prototype.toJSON = function () {
  return ([...this.values()])
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

const pinia = createPinia()
app.use(pinia)
app.use(router)
app.mount("#app")
