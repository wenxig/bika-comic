<script setup lang='ts' generic="T extends NonNullable<VirtualListProps['items']>[number]">
import { type NVirtualList, VirtualListProps } from 'naive-ui'
import { ceil, debounce, isEmpty } from 'lodash-es'
import { StyleValue, shallowRef, watch } from 'vue'
import { useScroll } from '@vueuse/core'
const $props = withDefaults(defineProps<{
  isRequesting: boolean
  itemHeight: number
  data: T[]
  class?: any
  end?: boolean
  itemResizable?: boolean
  reloadable?: boolean
  style?: StyleValue
  listProp?: Partial<VirtualListProps>
}>(), {
  listProp: <any>{}
})
const $emit = defineEmits<{
  next: [then?: () => void]
  reload: [then: () => void]
}>()
const vList = shallowRef<InstanceType<typeof NVirtualList>>()
const { y: listScrollTop } = useScroll(() => vList.value?.getScrollContainer())
const handleScroll: VirtualListProps['onScroll'] = debounce(async () => {
  const list = vList.value?.virtualListInstRef?.itemsElRef?.querySelector(' .v-vl-visible-items')
  if (!list) return
  // 能用
  const { itemHeight, data, end: isEnd, isRequesting } = $props
  if ((itemHeight * (data.length - 2)) < (listScrollTop.value + (list?.children?.length ?? window.innerHeight / itemHeight) * itemHeight) && !isEnd && !isRequesting) {
    $emit('next')
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
watch([() => $props.data, isReq], ([data]) => {
  if (!isReq.value) if (((ceil(window.innerHeight / $props.itemHeight) + 2) > data.length) && !$props.end) {
    isReq.value = true
    $emit('next', () => isReq.value = false)
  }
}, { immediate: true })
</script>

<template>
  <van-pull-refresh v-model="isRefreshing" :class="[$props.class]" @refresh="refreshing"
    :disabled="!reloadable || isRequesting || Boolean(listScrollTop && !isRequesting && !isPullRereshHold)"
    @change="({ distance }) => isPullRereshHold = !!distance" :style>
    <template v-if="isRequesting && !isRefreshing && isEmpty(data)">
      <div class="w-full flex mt-2 justify-center items-center !h-[24px]" :style>
        <van-loading size="24px">加载中...</van-loading>
      </div>
    </template>
    <NEmpty v-if="!(reloadable && isRefreshing) && !isRequesting && isEmpty(data)" description="无结果"
      class="w-full !justify-center !h-full" :class="$props.class" :style />
    <NVirtualList :="listProp" :item-resizable :item-size="itemHeight" @scroll="handleScroll"
      class="overflow-x-hidden h-full" :items="data" v-if="!isEmpty(data)" v-slot="item: { item: T, index: number }"
      ref="vList" :class="[isPullRereshHold ? 'overflow-y-hidden' : 'overflow-y-auto']">
      <slot :height="itemHeight" :data="{ item: item.item, index: data.indexOf(item.item) }"></slot>
    </NVirtualList>
  </van-pull-refresh>
</template>