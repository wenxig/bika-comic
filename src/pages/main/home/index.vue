<script setup lang='ts'>
</script>
<template>
  <RouterView v-slot="{ Component }">
    <component :is="Component" />
  </RouterView>
</template>

<style scoped>
.input::-webkit-search-cancel-button {
  display: none;
}
</style>