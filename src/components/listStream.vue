<script setup lang='ts' generic="T extends NonNullable<VirtualListProps['items']>[number]">
import { type NVirtualList, VirtualListProps } from 'naive-ui'
import { ceil, debounce, isEmpty } from 'lodash-es'
import { StyleValue, shallowRef, watch } from 'vue'
import { useScroll } from '@vueuse/core'
import StreamContent from '@/components/streamContent.vue'
import { Stream } from '@/utils/data'
const $props = withDefaults(defineProps<{
  itemHeight: number
  stream: Stream<T>
  itemResizable?: boolean
  listProp?: Partial<VirtualListProps>
  goBottom?: boolean

  style?: StyleValue
  class?: any
}>(), {
  listProp: <any>{}
})
const vList = shallowRef<InstanceType<typeof NVirtualList>>()
const { y: listScrollTop } = useScroll(() => vList.value?.getScrollContainer())
const handleScroll: VirtualListProps['onScroll'] = debounce(async () => {
  const list = vList.value?.virtualListInstRef?.itemsElRef?.querySelector(' .v-vl-visible-items')
  if (!list) return
  // 能用
  const { itemHeight, stream } = $props
  if ((itemHeight * (stream._length - 2)) < (listScrollTop.value + (list?.children?.length ?? window.innerHeight / itemHeight) * itemHeight) && !stream._isDone && !stream._isRequesting) {
    if (stream.error) stream.retry()
    else stream.next()
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
const refreshing = async () => {
  $props.stream.reset()
  await $props.stream.next()
  isRefreshing.value = false
}

watch($props.stream.data, () => {
  console.log(`<list> data changed; goBottom:`, $props.goBottom)
  if ($props.goBottom) vList.value?.scrollTo({ position: 'bottom', behavior: 'instant' })
}, { flush: 'post', deep: true })
watch([$props.stream.isRequesting, $props.stream.length, $props.stream.isDone, $props.stream.error], ([isRequesting, length, isDone, error]) => {
  if (!isRequesting) if (((ceil(window.innerHeight / $props.itemHeight) + 2) > length) && !isDone) {
    if (error) $props.stream.retry()
    else $props.stream.next()
  }
}, { immediate: true })
</script>

<template>
  <VanPullRefresh v-model="isRefreshing" :class="[$props.class]" @refresh="refreshing"
    :disabled="!stream.error.value || stream.isRequesting.value || (!stream.isRequesting.value && !isPullRefreshHold)"
    @change="({ distance }) => isPullRefreshHold = !!distance" :style>
    <StreamContent :stream class-loading="mt-2 !h-[24px]" class-empty="!h-full" class-error="!h-full">
      <NVirtualList :="listProp" :item-resizable :item-size="itemHeight" @scroll="handleScroll"
        class="overflow-x-hidden h-full" :items="stream.data.value" v-if="!isEmpty(stream.data.value)"
        v-slot="item: { item: T, index: number }" ref="vList"
        :class="[isPullRefreshHold ? 'overflow-y-hidden' : 'overflow-y-auto']">
        <slot :height="itemHeight" :data="{ item: item.item, index: stream.data.value.indexOf(item.item) }">
        </slot>
      </NVirtualList>
    </StreamContent>

  </VanPullRefresh>
</template>