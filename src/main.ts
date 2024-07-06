import { createApp } from "vue";
import { createPinia } from "pinia";
import { init } from "@/stores";
import App from "./App.vue";
import router from "./router";
import "@/index.scss";
import "@vant/touch-emulator"
import relativeTime from 'dayjs/plugin/relativeTime'
import dayjs from "dayjs"
import * as chat from "./api/chat"
dayjs.extend(relativeTime)
const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
init();
app.use(router);
app.mount("#app");
window.$api.chatUt = chat
// window.dayjs = dayjs