<script setup lang='ts'>
import { Announcement } from '@/api'
import { useAppStore } from '@/stores'
import { shallowRef, watch } from 'vue'
import Popup from '@/components/popup.vue'
import { createLoadingMessage } from '@/utils/message'

const show = defineModel<boolean>({ required: true })
const app = useAppStore()
const showAlertPops = shallowRef(false)
const alertData = shallowRef<Announcement>()
const overlay = shallowRef<HTMLDivElement>()
watch(alertData, () => {
  overlay.value!.scrollTo({ top: 0 })
}, { flush: 'post' })

const nextLoad = async (ok?: VoidFunction) => {
  const loading = createLoadingMessage()
  try {
    await app.announcements().next()
    loading.success()
  } catch {
    loading.fail()
  }
  if (ok) ok()
}
</script>

<template>
  <Popup v-model:show="show" position="right" class="w-full h-full overflow-x-hidden van-hairline--bottom shadow-sm"
    closeable>
    <div class="w-full h-[10%] text-[--p-color] text-lg font-bold flex items-center pl-3">公告</div>
    <List :item-height="160" :data="app.announcements().docs.value" class="h-[90%]" @next="nextLoad"
      :end="app.announcements().done.value" :is-requesting="app.announcements().isRequesting.value"
      v-slot="{ height, data: { item: announcement } }">
      <div class="w-full van-hairline--bottom flex" :style="{ height: `${height}px` }" @click="() => {
        alertData = announcement
        showAlertPops = true
      }">
        <Image :src="announcement.thumb" class="ml-[2%] w-[30%] h-full" fit="contain" />
        <div class="w-[62%] min-h-[98%] *:text-sm flex absolute right-[2%] flex-col *:text-justify">
          <span class="font-bold van-ellipsis text-[--van-text-color]">{{ announcement.title }}</span>
          <Text :text="announcement.content" :ellipsis="6" />
        </div>
      </div>
    </List>
  </Popup>
  <Popup v-model:show="showAlertPops" position="center" closeable noBorder
    class="w-4/5 h-[90%] bg-[--van-background-2] rounded-md overflow-hidden overflow-y-auto flex flex-col">
    <div ref="overlay" @click.stop class="w-full">
      <Image :src="alertData?.thumb ?? ''" previewable />
      <div class="text-[--p-color] text-center w-full text-lg font-bold">{{ alertData?.title }}</div>
      <Text :text="alertData?.content" class="m-1 w-[calc(100%-8px)]" />
    </div>
  </Popup>
</template>