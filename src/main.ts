import { createApp } from "vue"
import { createPinia } from "pinia"
import { init } from "@/stores"
import App from "./App.vue"
import router from "./router"
import "@/index.scss"
import "@vant/touch-emulator"
const app = createApp(App)
app.use(router)
const pinia = createPinia()
app.use(pinia)
init()
app.mount("#app")