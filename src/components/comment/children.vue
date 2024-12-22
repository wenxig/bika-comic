<script setup lang='ts'>
import { computed, ref, shallowRef, watch } from 'vue'
import { Comment, ChildrenCommentsStream, User } from '@/api'
import CommentRow from './commentRow.vue'
import { childrenComments } from '@/stores/temp'
import { useElementSize } from '@vueuse/core'
import { createLoadingMessage } from '@/utils/message'
import CommentSender from './commentSender.vue'
import { isEmpty } from 'lodash-es'
import FloatPopup from '@/components/floatPopup.vue'
import Popup from '@/components/popup.vue'
const floatPopup = shallowRef<InstanceType<typeof FloatPopup>>()
const $emit = defineEmits<{
  comment: [c: Comment]
  close: []
  showUser: [user: User],
}>()
defineProps<{
  _father?: Comment
  closeRouter?: string
  anchors?: 'high' | 'low'
}>()
const ITEM_HEIGHT = 120
const _id = shallowRef('')

const commitStream = shallowRef(new ChildrenCommentsStream(''))

watch(_id, _id => {
  if (childrenComments.has(_id)) commitStream.value = childrenComments.get(_id)!
  else childrenComments.set(_id, commitStream.value = new ChildrenCommentsStream(_id))
  if (!commitStream.value.done.value) commitStream.value.next()
})
const reload = async () => {
  commitStream.value.reload()
  if (!commitStream.value.done.value) await commitStream.value.next()
}
defineExpose({
  show(commentId: string) {
    _id.value = commentId
    floatPopup.value?.show()
  },
  close() {
    floatPopup.value?.close()
  },
  isShowing: computed(() => floatPopup.value?.isShowing ?? false)
})
const topCommentEl = ref<HTMLDivElement>()
const { height: topCommentElHeight } = useElementSize(topCommentEl)

const nextLoad = async () => {
  if (isEmpty(commitStream.value.docs.value) && !commitStream.value.done.value) return await commitStream.value.next()
  const loading = createLoadingMessage()
  if (!commitStream.value.done.value) await loading.bind(commitStream.value.next(), false)
}
const fullComment = ref<Comment>()
const showComment = shallowRef(false)
</script>

<template>
  <FloatPopup ref="floatPopup" :anchors lock-scroll>
    <div ref="topCommentEl">
      <CommentRow v-if="_father" :comment="_father" :height="ITEM_HEIGHT" show-children-comment
        @comment="$emit('comment', _father!)" class="!border-none" @show-user="$emit('showUser', _father?._user!)"
        :ellipsis="undefined" />
    </div>
    <List :is-requesting="commitStream.isRequesting.value" :end="commitStream.done.value"
      :data="commitStream.docs.value" :item-height="ITEM_HEIGHT" @next="nextLoad" v-slot="{ data, height }"
      item-resizable reloadable @reload="then => reload().then(then)" :is-err="commitStream.isErr.value"
      :err-cause="commitStream.errCause.value" retriable @retry="commitStream.retry()"
      :style="`height:calc(100% - ${topCommentElHeight}px - 40px);background-color:var(--van-background);`">
      <CommentRow :comment="data.item" @show-user="$emit('showUser', data.item?._user!)" class="!border-none" :height
        :ellipsis="3" @click="showComment = !!(fullComment = data.item)" />
    </List>
    <CommentSender :defSendAddress="_father" @afterSend="reload()" />
  </FloatPopup>
  <Popup class="overflow-hidden" v-model:show="showComment" position="bottom" round closeable
    @closed="fullComment = undefined">
    <CommentRow v-if="fullComment" :comment="fullComment" :height="ITEM_HEIGHT"
      @comment="$emit('comment', fullComment!)" @show-user="$emit('showUser', fullComment?._user!)"
      :ellipsis="undefined" />
  </Popup>
</template>

<style scoped lang='scss'>
:deep(.van-floating-panel__content) {
  overflow: hidden;
}
</style>
