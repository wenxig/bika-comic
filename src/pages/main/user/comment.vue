<script setup lang='ts'>
import { isEmpty } from 'lodash-es'
import { likeComment, Comment, UserSentComment } from '@/api'
import { createLoadingMessage } from '@/utils/message'
import { onMounted, reactive, ref, shallowRef } from 'vue'
import Children from '@/components/comment/children.vue'
import { useAppStore } from '@/stores'
import PreviewUser from '@/components/user/previewUser.vue'
import CommentRow from '@/components/comment/commentRow.vue'
document.title = '我的评论 | bika'
const app = useAppStore()
const _father = ref<Comment>()
const children = shallowRef<InstanceType<typeof Children>>()
const previewUser = shallowRef<InstanceType<typeof PreviewUser>>()

import List from '@/components/list.vue'
import { userPageScroll } from '@/stores/temp'
import { onBeforeRouteLeave } from 'vue-router'
const list = shallowRef<GenericComponentExports<typeof List>>()
onMounted(() => {
  list.value?.listInstanse?.scrollTo({ top: userPageScroll.comment })
})
onBeforeRouteLeave(() => {
  if (list.value?.scrollTop) userPageScroll.comment = list.value?.scrollTop
})

const loadNext = () => createLoadingMessage().bind(app.user()?.comments.next())

const createComment = (comment: UserSentComment) => reactive(new Comment({ ...comment, _user: app.user()!.data, _comic: comment._comic._id, isTop: false }))
</script>

<template>
  <VanNavBar title="我的评论" left-text="返回" left-arrow @click-left="$router.back()" />
  <List :item-height="120" item-resizable reloadable
    @reload="then => { app.user()?.comments.reload(); app.user()?.comments.next().then(then) }"
    class="h-[calc(100%-46px)] w-full" :data="app.user()?.comments.docs.value ?? []" ref="list"
    :is-requesting="isEmpty(app.user()) || !!app.user()?.comments.isRequesting.value"
    v-slot="{ height, data: { item: comment } }" @next="loadNext()"
    :end="isEmpty(app.user()) ? false : (app.user()!.comments.done.value)">
    <CommentRow @click="c => {
      _father = c
      children?.show(comment._id)
    }" :height :comment="createComment(comment)">
      <span class="ml-1 text-[--p-color] max-w-[50vw] text-nowrap van-ellipsis"
        @click.stop="$router.force.push(`/comic/${comment._comic._id}`)">{{ comment._comic.title }}</span>
    </CommentRow>
  </List>
  <Children :_father ref="children" @show-user="previewUser?.show" />
  <PreviewUser ref="previewUser" />
</template>
