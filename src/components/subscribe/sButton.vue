<script setup lang='ts'>
defineProps<{
  disabled?: boolean
  isSubscribes: boolean
  size?: number
}>()
defineEmits<{
  deleteSubscribe: [],
  addSubscribe: []
}>()
defineSlots<{
  default(data: { isSubscribes: boolean }): void
}>()

</script>

<template>
  <div class="relative" @click.stop
    :style="[`height:${size ?? 36}px;`, !!$slots.default ? `min-width:${size ?? 36}px;width: fit-content;` : `width:${size ?? 36}px;`]">
    <VanButton :disabled :style="`font-size:${(size ?? 36) / 2}px !important;`" icon="bell" type="primary"
      v-if="!$slots.default" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-full van-haptics-feedback" size="large"
      @click="isSubscribes ? $emit('deleteSubscribe') : $emit('addSubscribe')" />
    <VanButton :disabled :style="`font-size:${(size ?? 36) / 2}px !important;`" icon="bell" type="primary" v-else
      class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-full van-haptics-feedback" size="large"
      @click="isSubscribes ? $emit('deleteSubscribe') : $emit('addSubscribe')">
      <slot :isSubscribes></slot>
    </VanButton>
    <template v-if="isSubscribes">
      <VanIcon name="minus"
        class="sub-icon icon rotate-45 !absolute !top-1/2 !left-1/2 !-translate-x-1/2 !-translate-y-1/2 pointer-events-none"
        :size="size ? `${size+1}px` :`calc(var(--van-button-icon-size) * 2 + 1px)`" color="var(--van-button-primary-color)" />
      <VanIcon name="circle"
        class="rotate-45 icon !absolute !top-1/2 !left-1/2 !-translate-x-1/2 !-translate-y-1/2 pointer-events-none"
        :size="size ? `${size}px` : `calc(var(--van-button-icon-size) * 2)`" color="var(--van-button-primary-color)" />
    </template>
  </div>
</template>
<style scoped lang='scss'>
.sub-icon::before {
  -webkit-text-stroke: 1px var(--p-color);
}

.icon::before {
  pointer-events: none;
}
</style>