<script setup lang='ts' generic="T extends NonNullable<VirtualListProps['items']>[number]">
import { type NVirtualList, VirtualListProps } from 'naive-ui'
import { ceil, debounce, isEmpty } from 'lodash-es'
import { StyleValue, shallowRef, watch } from 'vue'
import { useScroll } from '@vueuse/core'
import { SPromiseContent, Stream } from '@/utils/data'
import Content from './content.vue'
type Source = {
  data: SPromiseContent<T[]>
  isEnd?: boolean
  itemResizable?: boolean
  retriable?: boolean
  resetable?: boolean
} | Stream<T>
const $props = withDefaults(defineProps<{
  source: Source
  itemHeight: number
  listProp?: Partial<VirtualListProps>
  goBottom?: boolean

  style?: StyleValue
  class?: any
}>(), {
  listProp: <any>{}
})
const $emit = defineEmits<{
  next: [then?: () => void]
  reset: [then?: () => void]
  retry: []
}>()
const vList = shallowRef<InstanceType<typeof NVirtualList>>()
const { y: listScrollTop } = useScroll(() => vList.value?.getScrollContainer())
const handleScroll: VirtualListProps['onScroll'] = debounce(async () => {
  const list = vList.value?.virtualListInstRef?.itemsElRef?.querySelector(' .v-vl-visible-items')
  if (!list) return
  // 能用
  const { itemHeight, data: { data, isError, isLoading }, isEnd } = $props
  if (!data) return
  if ((itemHeight * (data.length - 2)) < (listScrollTop.value + (list?.children?.length ?? window.innerHeight / itemHeight) * itemHeight) && !isEnd && !isLoading) {
    if (isError && $props.resetable) $emit('retry')
    else $emit('next', () => isReq.value = false)
  }
}, 200)
defineExpose({
  scrollTop: listScrollTop,
  listInstance: vList,
})
defineSlots<{
  default(props: { height: number, data: { item: T, index: number } }): any
}>()
const isRefreshing = shallowRef(false)
const isPullRefreshHold = shallowRef(false)
const refreshing = () => $emit('reset', () => isRefreshing.value = false)

const isReq = shallowRef(false)
watch(() => $props.data, () => {
  console.log(`<list> data changed; goBottom:`, $props.goBottom)
  if ($props.goBottom) vList.value?.scrollTo({ position: 'bottom', behavior: 'instant' })
}, { flush: 'post', deep: true })
watch([() => $props.data, isReq], ([data]) => {
  if (!isReq.value) if (data.data && ((ceil(window.innerHeight / $props.itemHeight) + 2) > data.data.length) && !$props.isEnd) {
    isReq.value = true
    if ($props.data.isError && $props.retriable) $emit('retry')
    else $emit('next', () => isReq.value = false)
  }
}, { immediate: true })
</script>

<template>
  <VanPullRefresh v-model="isRefreshing" :class="[$props.class]" @refresh="refreshing"
    :disabled="!resetable || data.isError || data.isLoading || (!data.isLoading && !isPullRefreshHold)"
    @change="({ distance }) => isPullRefreshHold = !!distance" :style>
    <Content :promise-content="data" class-loading="mt-2 !h-[24px]" class-empty="!h-full" class-error="!h-full"
      :retriable @retry="$emit('retry')">
      <NVirtualList :="listProp" :item-resizable :item-size="itemHeight" @scroll="handleScroll"
        class="overflow-x-hidden h-full" :items="data.data" v-if="data.data && !isEmpty(data.data)"
        v-slot="item: { item: T, index: number }" ref="vList"
        :class="[isPullRefreshHold ? 'overflow-y-hidden' : 'overflow-y-auto']">
        <slot :height="itemHeight" :data="{ item: item.item, index: data.data?.indexOf(item.item) ?? -1 }"></slot>
      </NVirtualList>
    </Content>
  </VanPullRefresh>
</template>