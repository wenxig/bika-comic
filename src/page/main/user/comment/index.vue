<script setup lang='ts'>
import { isEmpty, values } from 'lodash-es'
import { likeComment, Comment, reportComment } from '@/api'
import { createLoadingMessage } from '@/utils/message'
import { computed, onMounted, ref, shallowRef } from 'vue'
import Children from '@/page/comic/comments/children.vue'
import { useAppStore } from '@/stores'
import PreviewUser from '@/components/user/previewUser.vue'
import CommentRow from '@/page/comic/comments/commentRow.vue'
const app = useAppStore()
const _father = ref<Comment>()
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

const comments = computed(() => values(app.user?.comments))

import List from '@/components/list.vue'
import { userPageScroll } from '@/stores/temp'
import { onBeforeRouteLeave } from 'vue-router'
const list = shallowRef<GenericComponentExports<typeof List>>()
onMounted(() => {
  list.value?.listInstanse?.scrollTo({ top: userPageScroll.image })
})
onBeforeRouteLeave(() => {
  if (list.value?.scrollTop) userPageScroll.image = list.value?.scrollTop
})
</script>

<template>
  <VanNavBar title="我的评论" left-text="返回" left-arrow @click-left="$router.back()" />
  <List :item-height="120" item-resizable reloadable @reload="then => app.$reload.me().then(then)"
    class="h-[calc(100%-46px)]" :data="comments" :is-requesting="isEmpty(app.user)" ref="list"
    v-slot="{ height, data: { item: comment } }">
    <CommentRow @click="c => {
      _father = c
      children?.show(comment._id)
    }" :height
      :comment="new Comment(<any>{ ...comment, _user: app.user!.data, _comic: comment._comic._id, isTop: false })">
      <span class="ml-1 text-[--p-color] max-w-[50vw] text-nowrap van-ellipsis"
        @click.stop="$router.force.push(`/comic/${comment._comic._id}`)">{{ comment._comic.title }}</span>
    </CommentRow>
  </List>
  <Children :_father :handle-like ref="children" @show-user="previewUser?.show" />
  <PreviewUser ref="previewUser" />
</template>
