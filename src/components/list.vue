<script setup lang='ts' generic="T extends NonNullable<VirtualListProps['items']>[number],PF extends ((d: T[])=>any[])">
import { NVirtualList, VirtualListProps } from 'naive-ui'
import { ceil, debounce, isEmpty } from 'lodash-es'
import { StyleValue, shallowRef, watch } from 'vue'
import { IfAny, useScroll } from '@vueuse/core'
import { callbackToPromise, SPromiseContent, Stream } from '@/utils/data'
import Content from './content.vue'
import { computed } from 'vue'
import { motion } from 'motion-v'
type Source = {
  data: SPromiseContent<T[]>
  isEnd?: boolean
} | Stream<T>
const $props = withDefaults(defineProps<{
  source: Source
  itemHeight: number
  listProp?: Partial<VirtualListProps>
  goBottom?: boolean
  itemResizable?: boolean

  dataProcessor?: PF

  style?: StyleValue
  class?: any
}>(), {
  listProp: <any>{}
})
type Processed = IfAny<ReturnType<PF>[number], T, ReturnType<PF>[number]>
const $emit = defineEmits<{
  next: [then: () => void]
  reset: []
  retry: [then: () => void]
}>()
const dataProcessor = (v: T[]) => $props.dataProcessor?.(v) ?? v
const vList = shallowRef<InstanceType<typeof NVirtualList>>()
const { y: listScrollTop } = useScroll(() => vList.value?.getScrollContainer())
const unionSource = computed(() => ({
  ...Stream.isStream($props.source) ? {
    data: $props.source.data.value,
    isDone: $props.source.isDone.value,
    isRequesting: $props.source.isRequesting.value,
    isError: !!$props.source.error.value,
    length: dataProcessor($props.source.data.value).length,
    isEmpty: $props.source.isEmpty.value,
    source: $props.source
  } : {
    data: $props.source.data.data,
    isDone: $props.source.isEnd,
    isRequesting: $props.source.data.isLoading,
    isError: $props.source.data.isError,
    length: dataProcessor($props.source.data.data ?? []).length,
    isEmpty: $props.source.data.isEmpty,
    source: $props.source.data
  },
  next: () => Stream.isStream($props.source) ? $props.source.next() : callbackToPromise(r => $emit('next', r)),
  retry: () => Stream.isStream($props.source) ? $props.source.retry() : callbackToPromise(r => $emit('retry', r)),
  reset: () => Stream.isStream($props.source) ? $props.source.reset() : $emit('reset'),
}))
const handleScroll: VirtualListProps['onScroll'] = debounce(async () => {
  const list = vList.value?.virtualListInstRef?.itemsElRef?.querySelector(' .v-vl-visible-items')
  if (!list) return
  // 能用
  const { itemHeight } = $props
  const { data, isDone, isError, isRequesting, retry, next, length } = unionSource.value
  if (!data) return
  if (!isRequesting && !isDone && (itemHeight * (length - 2)) < (listScrollTop.value + (list?.children?.length ?? window.innerHeight / itemHeight) * itemHeight)) {
    if (isError) retry()
    else next()
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
  unionSource.value.reset()
  await unionSource.value.next()
  isRefreshing.value = false
}

watch(() => unionSource.value.data, () => {
  if ($props.goBottom) vList.value?.scrollTo({ position: 'bottom', behavior: 'instant' })
}, { flush: 'post', deep: true, immediate: true })
watch(unionSource, unionSource => {
  if (!unionSource.isRequesting) if (((ceil(window.innerHeight / $props.itemHeight) + 2) > unionSource.length) && !unionSource.isDone) {
    if (unionSource.isError) unionSource.retry()
    else unionSource.next()
  }
}, { immediate: true })
</script>

<template>
  <VanPullRefresh v-model="isRefreshing" :class="['relative', $props.class]" @refresh="refreshing"
    :disabled="unionSource.isError || unionSource.isRequesting || (isPullRefreshHold && unionSource.isRequesting)"
    @change="({ distance }) => isPullRefreshHold = !!distance" :style>
    <Content retriable :source="Stream.isStream(source) ? source : source.data" class-loading="mt-2 !h-[24px]"
      class-empty="!h-full" class-error="!h-full" @retry="unionSource.retry()"
      :hide-loading="isPullRefreshHold && unionSource.isRequesting">
      <Var :value="dataProcessor(unionSource.data ?? [])" v-slot="{ value }">
        <NVirtualList :="listProp" :item-resizable :item-size="itemHeight" @scroll="handleScroll"
          class="overflow-x-hidden h-full" :items="value" v-if="!isEmpty(value)"
          v-slot="item: { item: Processed, index: number }" ref="vList"
          :class="[isPullRefreshHold ? 'overflow-y-hidden' : 'overflow-y-auto']">
          <slot :height="itemHeight" :data="{ item: item.item, index: value.indexOf(item.item) }">
          </slot>
        </NVirtualList>
      </Var>
    </Content>
    <AnimatePresence>
      <motion.div v-if="unionSource.isRequesting && !isPullRefreshHold && !unionSource.isEmpty"
        :initial="{ opacity: 0, translateY: '100%', scale: 0.8 }" :animate="{ opacity: .5, translateY: 0, scale: 1 }"
        :exit="{ opacity: 0, translateY: '100%', scale: 0.8 }"
        class="rounded-full w-fit h-fit py-0.5 px-2 shadow-2xl flex justify-center items-center absolute bottom-2 left-1 bg-(--nui-primary-color) whitespace-nowrap ">
        <Loading size="10px" color="white">加载中</Loading>
      </motion.div>
    </AnimatePresence>
  </VanPullRefresh>
</template>