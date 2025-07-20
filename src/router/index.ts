import { createRouter, createWebHistory } from "vue-router"
import Index from '@/pages/index.vue';
export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      component: Index
    }
  ]
})