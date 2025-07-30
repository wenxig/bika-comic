<script setup lang='ts'>
import Image from '@/components/image.vue'
import { RowProps } from 'vant'
import { Comment } from '@/api/bika/comment'
import { UserProfile } from '@/api/bika/user'
import { likeComment, reportComment } from '@/api/bika/api/comment'
import { isNumber } from 'lodash-es'
import { createDateString } from '@/utils/translator'
import { LikeFilled, LikeOutlined } from '@vicons/antd'
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
        <Image :src="comment.$_user.$avatar" class="mt-2 size-10" round fit="cover" />
      </div>
    </VanCol>
    <VanCol class="!flex flex-col ml-1 relative" span="19">
      <div class="mt-2 flex flex-col">
        <div class="text-(--van-text-color)">{{ comment.$_user.name }}
          <span class="mr-1 text-xs text-(--nui-primary-color) font-normal">Lv{{ comment.$_user.level }}</span>
        </div>
        <span class="text-xs -mt-1 text-(--van-text-color-2)">
          {{ createDateString(comment.$created_at) }}
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
    <div class="absolute bottom-3 -translate-x-4 left-4/19 flex">
      <ToggleIcon :icon="LikeOutlined" row-mode v-model="comment.isLiked" @change="likeComment(comment._id)"
        size="22px">
        {{ comment.likesCount || '' }}
      </ToggleIcon>
      <button v-if="showChildrenComment" class="flex items-center bg-transparent border-none">
        <VanIcon name="chat-o" size="16px" />
        <span class="ml-1 text-[13px]" v-if="comment.commentsCount">{{ comment.commentsCount }}</span>
      </button>
      <span class="flex items-center mr-2 " @click.stop="reportComment(comment._id)">
        <VanIcon name="fail" size="16px" />
      </span>
      <slot />
    </div>
  </VanRow>
</template>