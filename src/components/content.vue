<script setup lang='ts' generic="T extends PromiseContent<any> | Stream<any>">
import { PromiseContent, Stream } from '@/utils/data'
import { ErrorRound } from '@vicons/material';
import { StyleValue, computed } from 'vue'
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
const $props = defineProps<{
  retriable?: boolean
  hideError?: boolean
  hideEmpty?: boolean
  hideLoading?: boolean
  source: T
} & StateCss>()
defineSlots<{
  default(data: { data?: T extends Stream<T> ? T['_data'] : T['data'] }): any
}>()
defineEmits<{
  retry: []
}>()
const unionSource = computed(() => Stream.isStream($props.source) ? {
  isLoading: $props.source.isRequesting.value,
  isError: $props.source.error.value,
  errorCause: $props.source.error.value,
  isEmpty: $props.source.isEmpty.value,
  data: <T extends Stream<T> ? T['_data'] : T['data']>$props.source.data.value,
  isNoResult: $props.source.isNoData.value
} : {
  isLoading: $props.source.isLoading,
  isError: $props.source.isError,
  errorCause: $props.source.errorCause,
  isEmpty: $props.source.isEmpty,
  data: <T extends Stream<T> ? T['_data'] : T['data']>$props.source.data,
  isNoResult: $props.source.isEmpty
})
</script>

<template>
  <!-- loading -->
  <div class="w-full flex justify-center items-center"
    v-if="!hideLoading && unionSource.isLoading && unionSource.isEmpty" :class="[$props.class, classLoading]"
    :style="[style, styleLoading]">
    <VanLoading size="24px">加载中...</VanLoading>
  </div>

  <!-- error -->
  <NResult v-else-if="!hideError && unionSource.isError" class="!items-center !justify-center flex flex-col"
    status="error" title="网络错误" :class="[$props.class, classError]" :style="[style, styleError]"
    :description="unionSource.errorCause ?? '未知原因'">
    <template #footer>
      <NButton v-if="retriable" @click="$emit('retry')" type="primary">重试</NButton>
    </template>
    <template #icon>
      <ErrorRound />
    </template>
  </NResult>

  <!-- empty -->
  <NEmpty v-else-if="!hideEmpty && unionSource.isNoResult" description="无结果" class="w-full !justify-center"
    :class="[$props.class, classEmpty]" :style="[style, styleEmpty]" />

  <!-- content -->
  <slot v-else :data="unionSource.data" />
</template>