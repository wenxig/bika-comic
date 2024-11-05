<script setup lang='ts' generic="T extends NonNullable<VirtualListProps['items']>[number]">
import { type NVirtualList, VirtualListProps } from 'naive-ui'
import { ceil, debounce, isEmpty } from 'lodash-es'
import { StyleValue, nextTick, shallowRef, watch } from 'vue'
import { useScroll } from '@vueuse/core'
import StateContent from '@/components/stateContent.vue'
const $props = withDefaults(defineProps<{
  isRequesting: boolean
  itemHeight: number
  isErr?: boolean
  data: T[]
  class?: any
  end?: boolean
  itemResizable?: boolean
  reloadable?: boolean
  style?: StyleValue
  listProp?: Partial<VirtualListProps>
  retriable?: boolean
  errCause?: string
  goBottom?: boolean
}>(), {
  listProp: <any>{}
})
const $emit = defineEmits<{
  next: [then?: () => void]
  reload: [then: () => void]
  retry: []
}>()
const vList = shallowRef<InstanceType<typeof NVirtualList>>()
const { y: listScrollTop } = useScroll(() => vList.value?.getScrollContainer())
const handleScroll: VirtualListProps['onScroll'] = debounce(async () => {
  const list = vList.value?.virtualListInstRef?.itemsElRef?.querySelector(' .v-vl-visible-items')
  if (!list) return
  // 能用
  const { itemHeight, data, end: isEnd, isRequesting } = $props
  if ((itemHeight * (data.length - 2)) < (listScrollTop.value + (list?.children?.length ?? window.innerHeight / itemHeight) * itemHeight) && !isEnd && !isRequesting) {
    if ($props.isErr && $props.reloadable) $emit('retry')
    else $emit('next', () => isReq.value = false)
  }
}, 200)
defineExpose({
  scrollTop: listScrollTop,
  listInstanse: vList,
})
defineSlots<{
  default(props: { height: number, data: { item: T, index: number } }): any
}>()
const isRefreshing = shallowRef(false)
const isPullRereshHold = shallowRef(false)
const refreshing = () => $emit('reload', () => isRefreshing.value = false)

const isReq = shallowRef(false)
watch(() => $props.data, () => {
  console.only(`<list> data changed; goBottom:`, $props.goBottom)
  if ($props.goBottom) vList.value?.scrollTo({ position: 'bottom', behavior: 'instant' })
}, { flush: 'post', deep: true })
watch([() => $props.data, isReq], ([data]) => {
  if (!isReq.value) if (((ceil(window.innerHeight / $props.itemHeight) + 2) > data.length) && !$props.end) {
    isReq.value = true
    if ($props.isErr && $props.reloadable) $emit('retry')
    else $emit('next', () => isReq.value = false)
  }
}, { immediate: true })
watch(vList, vList => {
  if (!vList) return
  const list = vList.virtualListInstRef?.itemsElRef?.querySelector(' .v-vl-visible-items')
  list?.classList.add('overflow-x-hidden')
  // overflow-x-hidden
})
</script>

<template>
  <van-pull-refresh v-model="isRefreshing" :class="[$props.class]" @refresh="refreshing"
    :disabled="isErr || !reloadable || isRequesting || Boolean(listScrollTop && !isRequesting && !isPullRereshHold)"
    @change="({ distance }) => isPullRereshHold = !!distance" :style>
    <StateContent :errorCause="errCause" :is-loading="isRequesting && !isRefreshing && isEmpty(data)"
      class-loading="mt-2 !h-[24px]" :is-empty="!isRefreshing && !isRequesting && isEmpty(data)" class-empty="!h-full"
      :is-error="isErr && isEmpty(data)" class-error="!h-full" :retriable @retry="$emit('retry')">
      <NVirtualList :="listProp" :item-resizable :item-size="itemHeight" @scroll="handleScroll"
        class="overflow-x-hidden h-full" :items="data" v-if="!isEmpty(data)" v-slot="item: { item: T, index: number }"
        ref="vList" :class="[isPullRereshHold ? 'overflow-y-hidden' : 'overflow-y-auto']">
        <slot :height="itemHeight" :data="{ item: item.item, index: data.indexOf(item.item) }"></slot>
      </NVirtualList>
    </StateContent>

  </van-pull-refresh>
</template>