<script setup lang='ts'>
import { User } from '@/api'
import { computed, shallowRef } from 'vue'
import FloatPopup from '@/components/floatPopup.vue'
import { ChatUserProfile } from '@/api/chat'
import { useElementSize } from '@vueuse/core'

const floatPopup = shallowRef<InstanceType<typeof FloatPopup>>()
const contentBox = shallowRef<HTMLDivElement>()
const { height: contentBoxHeight } = useElementSize(contentBox)
const user = shallowRef<User | ChatUserProfile>()

defineExpose({
  show(u: User | ChatUserProfile) {
    floatPopup.value?.show(1)
    user.value = u
  },
  isShowing: computed(() => floatPopup.value?.isShowing),
  close() {
    floatPopup.value?.close()
  }
})
const anchors = computed(() => [0, (contentBoxHeight.value || Math.floor(window.innerHeight * 0.20)) + 30, __VAN_CELL_HEIGHT__ + 30 + (contentBoxHeight.value || Math.floor(window.innerHeight * 0.20)), window.innerHeight])
</script>

<template>
  <FloatPopup ref="floatPopup" :anchors overlay class="overflow-hidden">
    <div class="overflow-hidden">
      <div ref="contentBox" class="w-full flex justify-center items-start backdrop-blur-lg van-hairline--bottom">
        <UserInfo :user class="min-h-[20vh]" />
      </div>
      <VanCell title="查看该上传者作品" icon="search-o" is-link
        @click="user && $router.force.push(`/search?mode=uploader&keyword=${user._id}`)" />
    </div>
  </FloatPopup>
</template>