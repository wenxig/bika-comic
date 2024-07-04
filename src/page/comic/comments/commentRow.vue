<script setup lang='ts'>
import Image from '@/components/image.vue'
import { Comment, User } from '@/api'
import { RowProps } from 'vant'
import userIcon from '@/assets/images/userIcon.png?url'
const $props = defineProps<{
  comment: Comment
  height: number
  showChildrenComment?: boolean
  ellipsis?: number | undefined
} & Partial<RowProps>>()
defineEmits<{
  comment: [c: Comment]
  click: [c: Comment]
  showUser: [user: User]
}>()
defineSlots<{
  default(): void
}>()
</script>

<template>
  <VanRow v-bind="$props"
    class="van-hairline--bottom relative pb-[24px] bg-[--van-background-2] text-[--van-text-color]"
    :style="`min-height:${height - 24}px;`" @click="$emit('click', comment)"
    :class="{ 'border-x border-b border-t-0 first:!border-t-[1px] border-[--van-primary-color] border-solid': comment.isTop }">
    <VanCol span="4" class="!flex justify-center items-start">
      <div @click.stop="$emit('showUser', comment._user)">
        <Image :src="comment._user.avatar || userIcon" class="h-[3.5rem] mt-2 w-[3.5rem]" round fit="cover" />
      </div>
    </VanCol>
    <VanCol class="!flex flex-col ml-1" span="19">
      <div class="flex">
        <div class="font-bold">{{ comment._user.name }}</div>
        <span class="text-xs m-1 text-[--van-text-color-2]">
          <NTime :time="new Date(comment.created_at)"></NTime>
        </span>
      </div>
      <template v-if="comment.hide">
        <div class="h-auto text-wrap text-[--van-text-color-2]">评论被举报</div>
      </template>
      <template v-else>
        <Text :text="comment.content" :ellipsis="'ellipsis' in $props ? ellipsis : 3" />
      </template>
    </VanCol>
    <div class="absolute bottom-1 right-1 flex">
      <span class="flex items-center mr-2 " @click.stop="comment.report()">
        <VanIcon name="fail" size="16px" />
      </span>
      <span class="flex items-center mr-2 " @click.stop="comment.like()">
        <VanIcon name="like-o" color="var(--van-primary-color)" size="16px" v-if="comment.isLiked" />
        <VanIcon name="like-o" size="16px" v-else />
        <span class="ml-1 text-[13px]" v-if="comment.likesCount">{{ comment.likesCount }}</span>
      </span>
      <button v-if="showChildrenComment" class="flex items-center bg-transparent border-none"
        @click.stop="$emit('comment', comment)">
        <VanIcon name="chat-o" size="16px" />
        <span class="ml-1 text-[13px]">{{ comment.commentsCount }}</span>
      </button>
      <slot />
    </div>
  </VanRow>
</template>