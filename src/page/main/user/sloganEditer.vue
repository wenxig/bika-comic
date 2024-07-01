<script setup lang='ts'>
import { shallowRef, watch } from 'vue'
import Popup from '@/components/popup.vue'
const $props = defineProps<{
  base?: string
}>()
const showEdit = shallowRef(false)
const text = shallowRef('123')
watch(() => $props.base, base => {
  console.log('base slogan:', base)
  base && (text.value = base)
}, { immediate: true })
defineEmits<{
  submit: [value: string]
}>()
defineExpose({
  show() {
    showEdit.value = true
  }
})
</script>

<template>
  <Popup v-model:show="showEdit" position="bottom" round
    class="overflow-hidden max-h-[100vh] min-h-[40vh] bg-[--van-background]">
    <VanForm @submit="$emit('submit', text)" class="h-full">
      <VanCell title="简介更新">
        <VanButton type="primary" plain size="small" @click="showEdit = false" class="mr-2">取消</VanButton>
        <VanButton type="primary" native-type="submit" size="small">确定</VanButton>
      </VanCell>
      <van-cell-group inset class="mt-3 overflow-y-auto overflow-x-hidden !max-h-[calc(100vh-53px-24px)] mb-[12px]">
        <VanField v-model="text" type="textarea" autosize maxlength="200" show-word-limit class="w-full border"
          label-align="top" :spellcheck="false" />
      </van-cell-group>
    </VanForm>
  </Popup>
</template>