<script setup lang='ts'>
import { ProPlusMaxComic, Comment, sendComment, sendChildComment } from '@/api'
import { Ref, shallowRef } from 'vue'
import ComicCard from '@/components/comic/comicCard.vue'
import CommentRow from './commentRow.vue'
import { createLoadingMessage } from '@/utils/message'
import emiter from './emiter'
import { useAppStore } from '@/stores'
import Popup from '@/components/popup.vue'

const show = shallowRef(false)
const comic = shallowRef<ProPlusMaxComic>()
const comment = shallowRef<Comment>()
const app = useAppStore()
let isChildren = false

const input = shallowRef('')
defineExpose<{
  show(comic: ProPlusMaxComic, isChildren: false): void
  show(comment: Comment, isChildren: true): void
  isShowing: Ref<boolean>
  close(): void
}>({
  isShowing: show,
  show(tag, _isChildren) {
    show.value = true
    input.value = ''
    isChildren = _isChildren
    if (_isChildren) {
      comment.value = tag as Comment
      comic.value = undefined
    } else {
      comic.value = tag as ProPlusMaxComic
      comment.value = undefined
    }
  },
  close() {
    show.value = false
  }
})

async function submit() {
  const loading = createLoadingMessage('发送中')
  try {
    if (isChildren) {
      await sendChildComment(comment.value!._id, input.value)
      emiter.emit('childrenCommitReload', [comment.value!._id])
    } else {
      await sendComment(comic.value!._id, input.value)
      emiter.emit('commitReload', [])
      app.user = undefined
    }
    loading.success()
    show.value = false
    input.value = ''
  } catch {
    loading.fail()
  }
}
</script>

<template>
  <Popup v-model:show="show" position="center"
    class="w-[98vw] h-[98vh] my-[1vh] mx-[1vw] bg-[--van-background]" round>
    <div class="h-8 pr-2 flex justify-end items-center bg-[--van-background-2] rounded-t-2xl">
      <van-icon name="cross" size="1.5rem" @click="show = false" color="var(--van-text-color)" />
    </div>
    <div class="w-full">
      <ComicCard v-if="comic" class="w-full" :comic :height="120" disabled resizeable />
      <CommentRow v-else-if="comment" class="w-full !border-none" :comment :height="120" />
      <VanForm @submit="submit" class="mt-2">
        <VanCellGroup inset>
          <VanField autosize type="textarea" label-align="top" v-model="input" name="content" label="内容"
            placeholder="填写你的评论..." :rules="[{ required: true, message: '不能发送空内容' }]" />
        </VanCellGroup>
        <div style="margin: 16px;">
          <VanButton round block type="primary" native-type="submit">
            提交
          </VanButton>
        </div>
      </VanForm>
    </div>
  </Popup>
</template>