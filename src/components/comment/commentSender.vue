<script setup lang='ts'>
import { Comment, sendComment, sendChildComment, Comic } from '@/api'
import { shallowRef } from 'vue'
import { createLoadingMessage } from '@/utils/message'
import { useAppStore } from '@/stores'
import Popup from '@/components/popup.vue'
import { FieldInstance } from 'vant'
import { isString } from 'lodash-es'
import config from '@/config'

const show = shallowRef(false)
type SentTo = Comic | Comment
const sendTo = shallowRef<SentTo>()
const app = useAppStore()

const input = shallowRef('')
const $props = withDefaults(defineProps<{
  defSendAddress?: SentTo | string
  isComic?: boolean
  childCommentSender?(id: string, content: string): Promise<any>
  commentSender?(id: string, content: string): Promise<any>
}>(), {
  childCommentSender: sendChildComment,
  commentSender: sendComment
})
const $emit = defineEmits<{
  afterSend: []
}>()

const isSubmitting = shallowRef(false)
async function submit() {
  if (input.value == '') return window.$message.info('评论内容不能为空')
  isSubmitting.value = true
  const loading = createLoadingMessage('发送中')
  const st = sendTo.value ?? $props.defSendAddress
  try {
    if (!st) throw false
    if (st instanceof Comment) {
      await $props.childCommentSender(st!._id, input.value)
    } else if (st instanceof Comic) {
      await $props.commentSender(st!._id, input.value)
      app.user()?.comments.reload()
    } else {
      if (!isString($props.defSendAddress)) throw false
      const st = sendTo.value?._id ?? $props.defSendAddress
      if ($props.isComic) {
        await $props.commentSender(st!, input.value)
      } else {
        await $props.childCommentSender(st!, input.value)
      }
    }
    $emit('afterSend')
    loading.success()
    show.value = false
    input.value = ''
  } catch (err) {
    console.error(err, st)
    loading.fail()
  }
  isSubmitting.value = false
}
const inputer = shallowRef<FieldInstance>()
defineExpose({
  force() {
    inputer.value?.focus()
  }
})
</script>

<template>
  <Popup v-model:show="show" position="bottom" class="w-full bg-[--van-background-2] max-h-[100vh]" round>
    <VanField type="textarea" class="w-full min-h-[30vh]" autosize v-model="input" placeholder="写下你的留言吧..."
      @click="inputer?.focus()" ref="inputer" />
    <div class="w-full h-8 flex items-center justify-end ">
      <VanButton round block type="primary" class="h-[80%] w-[60px] mr-3" :loading="isSubmitting" @click="submit()">
        提交
      </VanButton>
    </div>
  </Popup>
  <div class="w-full h-10 bg-[--van-background-2] flex justify-center items-center van-hairline--top" @click="async () => {
    show = true
    await $nextTick()
    inputer?.focus()
  }">
    <div :class="[config['bika.darkMode'] ? 'bg-[#333] text-[#666]' :'bg-gray-100 text-gray-300']" class="w-[90%] h-[80%] rounded-full px-2 flex items-center !text-xs van-ellipsis">
      {{ input || '写下你的留言吧...' }}
    </div>
  </div>
</template>