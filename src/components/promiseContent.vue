<script setup lang='ts' generic="T">
import { PromiseContent } from '@/utils/data'
import { StyleValue } from 'vue'
interface StateCss {
  class?: any
  classError?: any
  classEmpty?: any
  classLoading?: any
  style?: StyleValue
  styleError?: StyleValue
  styleEmpty?: StyleValue
  styleLoading?: StyleValue
}
defineProps<{
  retriable?: boolean
  promiseContent: PromiseContent<T>
} & StateCss>()
defineSlots<{
  default(data?: T): any
}>()
defineEmits<{
  retry: []
}>()

</script>

<template>
  <!-- loading -->
  <div class="w-full flex justify-center items-center" v-if="promiseContent.isLoading"
    :class="[$props.class, classLoading]" :style="[style, styleLoading]">
    <VanLoading size="24px">加载中...</VanLoading>
  </div>

  <!-- retry -->
  <NResult v-else-if="promiseContent.isError" class="!items-center !justify-center flex flex-col" status="error"
    title="网络错误" :class="[$props.class, classError]" :style="[style, styleError]"
    :description="promiseContent.errorCause ?? '未知原因'">
    <template #footer>
      <NButton v-if="retriable" @click="$emit('retry')" type="primary">重试</NButton>
    </template>
    <template #icon>
      <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32"
        class="w-20 h-20 text-(--n-icon-color)">
        <circle cx="11" cy="8" r="1" fill="currentColor"></circle>
        <circle cx="11" cy="16" r="1" fill="currentColor"></circle>
        <circle cx="11" cy="24" r="1" fill="currentColor"></circle>
        <path d="M24 3H8a2 2 0 0 0-2 2v22a2 2 0 0 0 2 2h10v-2H8v-6h18V5a2 2 0 0 0-2-2zm0 16H8v-6h16zm0-8H8V5h16z"
          fill="currentColor"></path>
        <path
          d="M29 24.415L27.586 23L25 25.587L22.414 23L21 24.415L23.586 27L21 29.586L22.414 31L25 28.414L27.586 31L29 29.586L26.414 27L29 24.415z"
          fill="currentColor"></path>
      </svg>
    </template>
  </NResult>

  <!-- empty -->
  <NEmpty v-else-if="promiseContent.isEmpty" description="无结果" class="w-full !justify-center"
    :class="[$props.class, classEmpty]" :style="[style, styleEmpty]" />

  <!-- content -->
  <slot v-else :data="promiseContent.data" />
</template>