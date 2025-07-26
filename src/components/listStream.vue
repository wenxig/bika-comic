<script setup lang='ts' generic="T extends NonNullable<VirtualListProps['items']>[number],PF extends ((d: T[])=>any[])">
import { type NVirtualList, VirtualListProps } from 'naive-ui'
import { ceil, debounce, isEmpty } from 'lodash-es'
import { StyleValue, shallowRef, watch } from 'vue'
import { IfAny, useScroll } from '@vueuse/core'
import { Stream } from '@/utils/data'
import Var from './var.vue'
import Content from './content.vue'
const $props = withDefaults(defineProps<{
  itemHeight: number
  stream: Stream<T>
  itemResizable?: boolean
  listProp?: Partial<VirtualListProps>
  goBottom?: boolean

  dataProcessor?: PF

  style?: StyleValue
  class?: any
}>(), {
  listProp: <any>{}
})
type Processed = IfAny<ReturnType<PF>[number], T, ReturnType<PF>[number]>
const vList = shallowRef<InstanceType<typeof NVirtualList>>()
const { y: listScrollTop } = useScroll(() => vList.value?.getScrollContainer())
const handleScroll: VirtualListProps['onScroll'] = debounce(async () => {
  const list = vList.value?.virtualListInstRef?.itemsElRef?.querySelector(' .v-vl-visible-items')
  console.log('list scrolled', vList.value)
  if (!list) return
  const { itemHeight, stream } = $props
  // 不能用, 待修复
  const length = ($props.dataProcessor?.(stream._data) ?? stream._data).length
  if ((itemHeight * (length - 2)) < (listScrollTop.value + (list?.children?.length ?? window.innerHeight / itemHeight) * itemHeight) && !stream._isDone && !stream._isRequesting) {
    console.log('<list> bottom')
    if (stream.error.value) stream.retry()
    else {
      console.log('<list> next')
      stream.next()
    }
  }
}, 200)
defineExpose({
  scrollTop: listScrollTop,
  listInstance: vList,
})
defineSlots<{
  default(props: { height: number, data: { item: Processed, index: number } }): any
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
const dataProcessor = (v: T[]) => $props.dataProcessor?.(v) ?? v
</script>

<template>
  <VanPullRefresh v-model="isRefreshing" :class="[$props.class]" @refresh="refreshing"
    :disabled="!stream.error.value || stream.isRequesting.value || (!stream.isRequesting.value && !isPullRefreshHold)"
    @change="({ distance }) => isPullRefreshHold = !!distance" :style>
    <Content :source="stream" class-loading="mt-2 !h-[24px]" class-empty="!h-full" class-error="!h-full">
      <Var :value="dataProcessor(stream.data.value)" v-slot="{ value }">
        <NVirtualList :="listProp" :item-resizable :item-size="itemHeight" @scroll="handleScroll"
          class="overflow-x-hidden h-full" :items="value" v-if="!isEmpty(value)"
          v-slot="item: { item: Processed, index: number }" ref="vList"
          :class="[isPullRefreshHold ? 'overflow-y-hidden' : 'overflow-y-auto']">
          <slot :height="itemHeight" :data="{ item: item.item, index: value.indexOf(item.item) }">
          </slot>
        </NVirtualList>
      </Var>
    </Content>
  </VanPullRefresh>
</template>