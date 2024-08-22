<script setup lang='ts'>
import { CommentsStream, Comment } from '@/api'
import { createLoadingMessage } from '@/utils/message'
import { onMounted, shallowRef, watch } from 'vue'
import ChildrenComments from './children.vue'
import PreviewUser from '@/components/user/previewUser.vue'
import CommentSender from './commentSender.vue'
import { onBeforeRouteLeave } from 'vue-router'
import CommentRow from './commentRow.vue'
import { comments, commentsScroll } from '@/stores/temp'
import { isEmpty } from 'lodash-es'
import List from '@/components/list.vue'
const list = shallowRef<GenericComponentExports<typeof List>>()
const $props = withDefaults(defineProps<{
  id: string
  listClass?: string
  streamMode?: 'comics' | 'games'
}>(), {
  streamMode: 'comics'
})
const commentHeight = defineModel<number>('height')
const commitStream = comments.has($props.id) ? comments.get($props.id)! : (() => {
  const c = new CommentsStream($props.id)
  comments.set($props.id, c)
  return c
})()
commitStream.host = $props.streamMode
const _father = shallowRef<Comment>()
const isShowComments = shallowRef(false)
const previewUser = shallowRef<InstanceType<typeof PreviewUser>>()
watch(commentHeight, commentHeight => (commentHeight! <= 0) && (isShowComments.value = false))
const childrenComments = shallowRef<InstanceType<typeof ChildrenComments>>()
onMounted(() => {
  if (isEmpty(commitStream.docs.value)) commitStream.next()
  if (commentsScroll.has($props.id)) list.value?.listInstanse?.scrollTo({ top: commentsScroll.get($props.id) })
})
const { isRequesting, done: searchDone, docs: data, top } = commitStream

const handleReloadCommit = () => {
  commitStream.reload()
  return commitStream.next()
}
onBeforeRouteLeave(() => {
  commentsScroll.set($props.id, list.value?.scrollTop ?? 0)
})
defineSlots<{
  default(): void
}>()

const nextLoad = async () => {
  if (isEmpty(commitStream.docs.value)) return await commitStream.next()
  const loading = createLoadingMessage()
  await loading.bind(commitStream.next(), false)
}
const commentSender = shallowRef<InstanceType<typeof CommentSender>>()
defineExpose({
  forceInput() {
    commentSender.value?.force()
  }
})
</script>

<template>
  <div class="w-full h-full overflow-hidden bg-[--van-background]" :style="`--father-height: ${commentHeight}px;`">
    <List :data="[...top, ...data]" ref="list" reloadable :item-height="120" :is-err="commitStream.isErr.value"
      :err-cause="commitStream.errCause.value" retriable @retry="commitStream.retry()"
      :class="[commentHeight && 'h-[calc(var(--father-height)-var(--van-floating-panel-header-height)-40px)]', $props.listClass]"
      :is-requesting :end="searchDone" v-slot="{ data: { item }, height }" @next="nextLoad"
      @reload="then => handleReloadCommit().then(then)">
      <CommentRow :comment="item" :height show-children-comment @click="() => {
        console.log('click comment')
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
