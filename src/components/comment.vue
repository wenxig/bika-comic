<script setup lang='ts'>
import { CommentsStream, likeComment, reportComment, Comment } from '@/api'
import { createLoadingMessage } from '@/utils/message'
import { onMounted, shallowRef, watch } from 'vue'
import ChildrenComments from '@/page/comic/comments/children.vue'
import PreviewUser from '@/components/user/previewUser.vue'
import { onBeforeRouteLeave } from 'vue-router'
import CommentRow from '@/page/comic/comments/commentRow.vue'
import emiter from '@/page/comic/comments/emiter'
import { comments, commentsScroll } from '@/stores/temp'
import { showConfirmDialog } from 'vant'
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
const anchors2 = [
  0,
  Math.round(0.3 * window.innerHeight),
  Math.round(0.6 * window.innerHeight),
  Math.round(0.9 * window.innerHeight),
]
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
const handleCommentLike = async (comment: Comment) => {
  const loading = createLoadingMessage('点赞中')
  const ret = await likeComment(comment._id)
  comment.isLiked = !comment.isLiked
  if (ret == 'like') comment.likesCount++
  else comment.likesCount--
  loading.success()
  return ret
}
const handleReportComment = (c: Comment) => void showConfirmDialog({
  message: '举报后会进行对该评论的审核',
  title: '确定举报？',
  teleport: 'body',
  className: `!z-[7000]`,
  overlayClass: `!z-[7000]`
})
  .then(() => reportComment(c._id))
const handleReloadCommit = () => {
  commitStream.reload()
  return commitStream.next()
}
emiter.on('commitReload', handleReloadCommit)
emiter.on('childrenCommitReload', ([id]) => {
  const dataIndex = data.value.findIndex(v => v._id == id)
  const topIndex = top.value.findIndex(v => v._id == id)
  let index: number
  if (dataIndex == -1) index = topIndex
  else index = dataIndex
  if (data.value[index]._id == id) data.value[index].commentsCount++
  else top.value[index].commentsCount++
})
onBeforeRouteLeave(() => {
  commentsScroll.set($props.id, list.value?.scrollTop ?? 0)
})
defineEmits<{
  comment: [c: Comment]
}>()
defineSlots<{
  default(): void
}>()

const nextLoad = async () => {
  if (isEmpty(commitStream.docs.value)) return await commitStream.next()
  const loading = createLoadingMessage()
  try {
    await commitStream.next()
    loading.success()
  } catch {
    loading.fail()
  }
}
</script>

<template>
  <div class="w-full h-full overflow-hidden bg-[--van-background]" :style="`--father-height: ${commentHeight}px;`">
    <List :data="[...top, ...data]" ref="list" reloadable item-resizable :item-height="120"
      :class="['h-[calc(var(--father-height)-var(--van-floating-panel-header-height))]', $props.listClass]"
      :is-requesting :end="searchDone" v-slot="{ data: { item }, height }" @next="nextLoad"
      @reload="then => handleReloadCommit().then(then)">
      <CommentRow :comment="item" :height @like="handleCommentLike(item)" show-children-comment @click="() => {
        console.log('click comment')
        _father = item
        childrenComments?.show(item._id)
      }" @show-user="previewUser?.show" @report="handleReportComment" :ellipsis="3"
        @comment="c => $emit('comment', c)">
        <slot />
      </CommentRow>
    </List>
  </div>
  <ChildrenComments ref="childrenComments" anchors="low" :handleLike="handleCommentLike" :_father
    @show-user="previewUser?.show" @report="handleReportComment" @comment="c => $emit('comment', c)" />
  <PreviewUser ref="previewUser" />
</template>
