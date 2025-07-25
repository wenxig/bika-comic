<script setup lang='ts'>
</script>
<template>
  <div class="w-full duration-200 transition-[height,transform] h-[calc(100%-98px)]">
    <RouterView v-slot="{ Component }">
      <component :is="Component" />
    </RouterView>
  </div>
</template>

<style scoped>
.input::-webkit-search-cancel-button {
  display: none;
}
</style>