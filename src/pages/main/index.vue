<script setup lang='ts'>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
const route = useRoute()
const name = computed(() => route.path.match(/(?<=\/main\/)\w+(?=\/)?/g)?.[0])
</script>

<template>
  <div class="w-full overflow-hidden h-[calc(100%-50px)]">
    <Suspense>
      <router-view v-slot="{ Component }">
        <component :is="Component" />
      </router-view>
    </Suspense>
  </div>
  <VanTabbar class="fixed bottom-0 transition-[opacity] opacity-100 w-full" :model-value="name">
    <van-tabbar-item name="home" to="/main/home" icon="home-o">主页</van-tabbar-item>
    <van-tabbar-item name="user" to="/main/user" icon="user-o">我的</van-tabbar-item>
  </VanTabbar>
</template>