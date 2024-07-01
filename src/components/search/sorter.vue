<script setup lang='ts'>
import config from '@/config'
import { sorterValue } from '@/utils/translater'
import { shallowRef } from 'vue'
import Popup from '@/components/popup.vue'
defineEmits<{
  reload: []
}>()
const showSorter = shallowRef(false)
const _sortValue = shallowRef([config.value.searchSort])
defineExpose({
  show() {
    showSorter.value = true
  }
})
</script>

<template>
  <Popup v-model:show="showSorter" round position="bottom">
    <van-picker :columns="sorterValue" @cancel="showSorter = false"
      @confirm="v => { console.log(v); config.value.searchSort = v.selectedValues[0]; showSorter = false; $emit('reload') }"
      v-model="_sortValue" />
  </Popup>
</template>