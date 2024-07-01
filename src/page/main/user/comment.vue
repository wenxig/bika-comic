<script setup lang='ts'>
import { isEmpty, values } from 'lodash-es'
import { likeComment, Comment, reportComment } from '@/api'
import { createLoadingMessage } from '@/utils/message'
import { shallowRef } from 'vue'
import Children from '@/page/comic/comments/children.vue'
import { useAppStore } from '@/stores'
import PreviewUser from '@/components/user/previewUser.vue'
import CommentRow from '@/page/comic/comments/commentRow.vue'
import { showConfirmDialog } from 'vant'
const app = useAppStore()
const _father = shallowRef<Comment>()
const handleLike = async (comment: Comment) => {
  const loading = createLoadingMessage('点赞中')
  const ret = await likeComment(comment._id)
  comment.isLiked = !comment.isLiked
  if (ret == 'like') comment.likesCount++
  else comment.likesCount--
  loading.success()
  return ret
}
const children = shallowRef<InstanceType<typeof Children>>()
const previewUser = shallowRef<InstanceType<typeof PreviewUser>>()


const handleReportComment = (c: Comment) => void showConfirmDialog({
  message: '举报后会进行对该评论的审核',
  title: '确定举报？'
})
  .then(() => reportComment(c._id))
</script>

<template>
  <List :item-height="120" item-resizable reloadable @reload="then => app.$reload.me().then(then)"
    class="h-[calc(100vh-var(--van-tabs-line-height)-240px-var(--van-tabbar-height))]"
    :data="values(app.user?.comments)" :is-requesting="isEmpty(app.user)" v-slot="{ height, data: { item: comment } }">
    <CommentRow @click="c => {
      _father = c
      children?.show(comment._id)
    }" @report="handleReportComment" :height
      :comment="new Comment(<any>{ ...comment, _user: app.user!.data, _comic: comment._comic._id, isTop: false })">
      <span class="ml-1 text-[--p-color] max-w-[50vw] text-nowrap van-ellipsis"
        @click.stop="$router.force.push(`/comic/${comment._comic._id}`)">{{ comment._comic.title }}</span>
    </CommentRow>
  </List>
  <Children :_father :handle-like ref="children" @show-user="previewUser?.show" @report="handleReportComment" />
  <PreviewUser ref="previewUser" />
</template>
