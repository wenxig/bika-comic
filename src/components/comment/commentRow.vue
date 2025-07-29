<script setup lang='ts'>
import Image from '@/components/image.vue'
import { RowProps } from 'vant'
import userIcon from '@/assets/images/userIcon.webp?url'
import { Comment } from '@/api/bika/comment'
import { UserProfile } from '@/api/bika/user'
import { likeComment, reportComment } from '@/api/bika/api/comment'
import { isNumber } from 'lodash-es'
const $props = defineProps<{
  comment: Comment
  height: number
  showChildrenComment?: boolean
  ellipsis?: number | undefined
} & Partial<RowProps>>()
const $emit = defineEmits<{
  click: [c: Comment]
  showUser: [user: UserProfile]
}>()
defineSlots<{
  default(): void
}>()
</script>

<template>
  <VanRow v-bind="$props" class="van-hairline--bottom relative pb-6 bg-(--van-background-2) text-(--van-text-color)"
    :style="`min-height:${height - 24}px;`" @click="$emit('click', comment)">
    <VanCol span="4" class="!flex justify-center items-start">
      <div @click.stop="$emit('showUser', comment.$_user)">
        <Image :src="comment.$_user.$avatar || userIcon" class="h-[3.5rem] mt-2 w-[3.5rem]" round fit="cover" />
      </div>
    </VanCol>
    <VanCol class="!flex flex-col ml-1" span="19">
      <div class="flex flex-col">
        <div class="text-(--van-text-color)">{{ comment.$_user.name }}
          <span class="mr-1 text-xs text-(--p-color) font-normal">Lv{{ comment.$_user.level }}</span>
        </div>
        <span class="text-xs -mt-1 text-(--van-text-color-2)">
          <NTime :time="new Date(comment.created_at)"></NTime>
        </span>
      </div>
      <template v-if="comment.hide">
        <div class="h-auto text-wrap text-(--van-text-color-2)">评论被举报</div>
      </template>
      <template v-else>
        <Text :text="comment.content" :ellipsis="isNumber($props.ellipsis) ? ellipsis : 3">
          <VanTag type="primary" v-if="comment.isTop" plain class="mr-1">置顶</VanTag>
        </Text>
      </template>
    </VanCol>
    <div class="absolute bottom-1 right-1 flex">
      <span class="flex items-center mr-2 " @click.stop="reportComment(comment._id)">
        <VanIcon name="fail" size="16px" />
      </span>
      <span class="flex items-center mr-2 " @click.stop="likeComment(comment._id)">
        <VanIcon name="like-o" color="var(--van-primary-color)" size="16px" v-if="comment.isLiked" />
        <VanIcon name="like-o" size="16px" v-else />
        <span class="ml-1 text-[13px]" v-if="comment.likesCount">{{ comment.likesCount }}</span>
      </span>
      <button v-if="showChildrenComment" class="flex items-center bg-transparent border-none">
        <VanIcon name="chat-o" size="16px" />
        <span class="ml-1 text-[13px]" v-if="comment.commentsCount">{{ comment.commentsCount }}</span>
      </button>
      <slot />
    </div>
  </VanRow>
</template>