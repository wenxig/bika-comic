<script setup lang='ts'>
import { useAppStore } from '@/stores'
import { computed, onUnmounted, watch } from 'vue'
import { ceil, isEmpty } from 'lodash-es'
import { createLoadingMessage } from '@/utils/message'
import config from '@/config'
import { sum } from 'lodash-es'
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


const exp = computed(() => app.user?.data.exp ?? 0)
const needExp = computed(() => 600 * (app.user?.data.level ?? 1) - 400)
const expPresent = computed(() => ceil((exp.value / needExp.value) * 100))

const teniggerMode = () => window.$message.info('青少年不能使用这个，快退出')
</script>

<template>
  <div class="w-full h-10 flex justify-end items-center bg-[--van-background-2]">
    <VanIcon color="var(--van-text-color-2)" class="mx-2"
      @click="config.value['bika.darkMode'] = !config.value['bika.darkMode']">
      <svg v-if="config.value['bika.darkMode']" xmlns="http://www.w3.org/2000/svg" class="w-7"
        xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24">
        <path d="M12 3h.393a7.5 7.5 0 0 0 7.92 12.446A9 9 0 1 1 12 2.992z" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
      </svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-7" xmlns:xlink="http://www.w3.org/1999/xlink"
        viewBox="0 0 24 24">
        <g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="4"></circle>
          <path d="M3 12h1m8-9v1m8 8h1m-9 8v1M5.6 5.6l.7.7m12.1-.7l-.7.7m0 11.4l.7.7m-12.1-.7l-.7.7"></path>
        </g>
      </svg>
    </VanIcon>
  </div>
  <NThing class="h-20 bg-[--van-background-2] relative">
    <template #avatar>
      <Image :src="app.user?.data.avatar" fit="cover" class="w-[4rem] h-[4rem] mt-1 ml-1" round></Image>
    </template>
    <template #header>
      <div class="mt-2 -mb-2">{{ app.user?.data.name }} <span class="mr-1 text-xs text-[--p-color] font-normal">Lv{{
          app.user?.data.level }}</span></div>
    </template>
    <template #description>
      <VanTag plain type="primary">
        <template v-if="app.user?.data.characters.includes('knight')">骑士</template>
        <template v-else>成员</template>
      </VanTag>
      <div class="flex !w-[60%] items-center">
        <span class="mr-1 no-color-change-transition text-xs text-[--van-text-color-2]">{{ exp }}/{{ needExp }}</span>
        <n-progress color="var(--p-color)" type="line" status="info" :percentage="expPresent" :show-indicator="false" />
      </div>
    </template>
    <div class="absolute text-xs text-[--van-text-color-2] top-1/2 right-3 -translate-y-1/2">编辑<van-icon name="arrow" /></div>
  </NThing>
  <VanRow class="w-full bg-[--van-background-2] h-[4rem]">
    <VanCol span="8">
      <n-statistic label="收藏" class="van-hairline--right">
        {{ app.user?.favourite.length ?? 0 }}
      </n-statistic>
    </VanCol>
    <VanCol span="8">
      <n-statistic label="关注">
        {{ app.subscribes.length ?? 0 }}
      </n-statistic>
    </VanCol>
    <VanCol span="8">
      <n-statistic label="获得的赞" class="van-hairline--left">
        {{ sum(app.user?.comments.map(v => v.likesCount)) || 0 }}
      </n-statistic>
    </VanCol>
  </VanRow>
  <div class="bg-[--van-background-2] w-full h-[calc(100%-2.5rem-5rem-4rem)] overflow-y-auto">
    <div class="w-full h-20 flex justify-around items-center text-[--p-color]">
      <div @click="$router.push('/user/history')" class="flex flex-col justify-center items-center van-haptics-feedback">
        <VanIcon name="clock-o" size="2rem"></VanIcon>
        <span>历史记录</span>
      </div>
      <div @click="$router.push('/user/favourt')" class="flex flex-col justify-center items-center van-haptics-feedback">
        <VanIcon name="star-o" size="2rem"></VanIcon>
        <span>我的收藏</span>
      </div>
      <div @click="$router.push('/user/image')" class="flex flex-col justify-center items-center van-haptics-feedback">
        <VanIcon name="photo-o" size="2rem"></VanIcon>
        <span>图片收藏</span>
      </div>
      <div @click="$router.push('/user/comment')" class="flex flex-col justify-center items-center van-haptics-feedback">
        <VanIcon name="chat-o" size="2rem"></VanIcon>
        <span>我的评论</span>
      </div>
    </div>
    <VanCell title="青少年模式" @click="teniggerMode" is-link></VanCell>
    <VanCell title="插件管理" is-link></VanCell>
  </div>
</template>
<style scoped lang='scss'>
:deep(.n-statistic__label),
:deep(.n-statistic-value) {
  text-align: center;
}
</style>