<script setup lang='ts'>
import { onMounted, shallowRef, watch } from 'vue'
import ChildrenComments from './children.vue'
import PreviewUser from '@/components/user/previewUser.vue'
import CommentSender from './commentSender.vue'
import { onBeforeRouteLeave } from 'vue-router'
import CommentRow from './commentRow.vue'
import { comments, commentsScroll } from '@/stores/temp'
import List from '@/components/list.vue'
import { ComponentExposed } from 'vue-component-type-helpers'
import { createCommentsStream } from '@/api/bika/api/comment'
import { Comment } from '@/api/bika/comment'
const list = shallowRef<ComponentExposed<typeof List>>()
const $props = withDefaults(defineProps<{
  id: string
  listClass?: string
  streamMode?: 'comics' | 'games'
}>(), {
  streamMode: 'comics'
})
const commentHeight = defineModel<number>('height')
const commitStream = comments.has($props.id) ? comments.get($props.id)! : (() => {
  const c = createCommentsStream($props.id, $props.streamMode)
  comments.set($props.id, c)
  return c
})()
const _father = shallowRef<Comment>()
const isShowComments = shallowRef(false)
const previewUser = shallowRef<InstanceType<typeof PreviewUser>>()
watch(commentHeight, commentHeight => (commentHeight! <= 0) && (isShowComments.value = false))
const childrenComments = shallowRef<InstanceType<typeof ChildrenComments>>()
onMounted(() => {
  // if (isEmpty(commitStream.docs.value)) commitStream.next()
  if (commentsScroll.has($props.id)) list.value?.listInstance?.scrollTo({ top: commentsScroll.get($props.id) })
})
const handleReloadCommit = () => {
  commitStream.reset()
  return commitStream.next()
}
onBeforeRouteLeave(() => {
  commentsScroll.set($props.id, list.value?.scrollTop ?? 0)
})
defineSlots<{
  default(): void
}>()

const commentSender = shallowRef<InstanceType<typeof CommentSender>>()
defineExpose({
  forceInput() {
    commentSender.value?.force()
  }
})
</script>

<template>
  <div class="w-full h-full overflow-hidden bg-(--van-background)" :style="`--father-height: ${commentHeight}px;`">
    <List :source="commitStream" ref="list" :item-height="120" v-slot="{ data: { item }, height }"
      :class="[commentHeight && 'h-[calc(var(--father-height)-var(--van-floating-panel-header-height)-40px)]', $props.listClass]">
      <CommentRow :comment="item" :height show-children-comment @click="() => {
        _father = item
        childrenComments?.show(item._id)
      }" @show-user="previewUser?.show" :ellipsis="3">
        <slot />
      </CommentRow>
    </List>
    <CommentSender ref="commentSender" @afterSend="handleReloadCommit()" :defSendAddress="$props.id" isComic />
  </div>
  <ChildrenComments ref="childrenComments" anchors="low" :_father @show-user="previewUser?.show" />
  <PreviewUser ref="previewUser" />
</template>
