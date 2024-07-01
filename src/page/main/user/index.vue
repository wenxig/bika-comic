<script setup lang='ts'>
import { useAppStore } from '@/stores';
import { onUnmounted, shallowRef, watch } from 'vue';
import { isEmpty } from 'lodash-es';
import { createLoadingMessage } from '@/utils/message';
import SaveImages from './saveImages.vue';
import Comment from './comment.vue';
import History from './history.vue';
import Favourt from './favourt.vue';
import SloganEditer from './sloganEditer.vue';
import { editSlogan } from '@/api';
const app = useAppStore()

document.title = '用户 | bika'
if (isEmpty(app.user)) {
  const loading = createLoadingMessage()
  watch(() => app.user, async user => {
    if (user) {
      loading.success()
    }
  }, { immediate: true })
  onUnmounted(() => {
    loading.destroy()
  })
}

const sloganEditer = shallowRef<InstanceType<typeof SloganEditer>>()
const submitSlogan = async (text: string) => {
  const loading = createLoadingMessage()
  try {
    await editSlogan(text)
    loading.success()
  } catch {
    loading.fail()
  }
}
</script>

<template>
  <div class="overflow-x-hidden overflow-y-auto h-full w-full flex flex-col">
    <UserInfo :user="app.user?.data" class="h-auto" editable @edit-slogan="sloganEditer?.show()" />
    <van-tabs swipeable class="w-full h-full">
      <van-tab title="历史">
        <History />
      </van-tab>
      <van-tab title="收藏">
        <favourt />
      </van-tab>
      <VanTab title="图片收藏">
        <SaveImages />
      </VanTab>
      <van-tab title="评论">
        <Comment />
      </van-tab>
    </van-tabs>
  </div>
  <SloganEditer v-if="app.user" ref="sloganEditer" @submit="submitSlogan" :base="app.user.data.slogan" />
</template>