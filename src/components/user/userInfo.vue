<script setup lang='ts'>
import { shallowRef, computed } from 'vue'
import { User } from '@/api'
import userIcon from '@/assets/images/userIcon.png?url'
const $props = defineProps<{
  user: User | undefined
  editable?: boolean
}>()
defineEmits<{
  editSlogan: [user: User]
}>()
const _exp = shallowRef(0)
const exp = computed(() => $props.user?.exp ?? 0)
const needExp = computed(() => 600 * ($props.user?.level ?? 1) - 400)
</script>

<template>
  <div class="w-full relative">
    <Image :src="$props.user?.avatar || userIcon" class="!absolute w-full h-full top-0 left-0" fit="cover" hide-error
      hide-loading />
    <VanSkeleton :loading="!user" class=" w-full !p-0">
      <div class="flex flex-col justify-center items-center w-full h-full backdrop-blur-lg">
        <div class="text-white text-sm my-1 shadow-lg bg-black bg-opacity-10 rounded px-1">
          lv{{ $props.user?.level }}({{ exp }} / {{ needExp }})
        </div>
        <div class="flex flex-col justify-center items-center w-[6rem] h-[6rem] relative my-1">
          <van-circle v-model:current-rate="_exp" :rate="(exp / needExp) * 100" :speed="100" text="" />
          <Image :src="$props.user?.avatar || userIcon" class="!absolute w-[calc(100%-6px)] h-[calc(100%-6px)]"
            fit="cover" round previewable />
        </div>
        <div class="flex my-1 rounded px-1">
          <VanTag round type="primary" size="medium" class="mr-1">
            {{ $props.user?.title }}
          </VanTag>
          <VanTag round type="primary" size="medium">
            {{ $props.user?.gender == 'm' ? '男' : $props.user?.gender == 'f' ? '女' : '无' }}
          </VanTag>
        </div>
        <div class="text-white text-xl my-1 shadow-lg bg-black bg-opacity-10 rounded px-1"
          @click="$router.force.push(`/search/?keyword=${encodeURIComponent($props.user!._id)}&mode=uploader`)">
          <span class="text-[--p-color] text-sm" v-if="$props.user?.characters.includes('knight')">骑士</span>
          <span class="text-[--p-color] text-sm" v-else>成员</span>
          {{ $props.user?.name }}
        </div>
        <div
          class="text-xs text-white max-w-4/5 text-center my-1 shadow-lg bg-black bg-opacity-10 rounded flex flex-col px-1 *:text-white">
          <Text :text="$props.user?.slogan ?? 'null'" @click="editable && $emit('editSlogan', user!)" />
        </div>
      </div>
      <template #template>
        <div class="flex flex-col justify-center items-center w-full backdrop-blur-lg">
          <VanSkeletonParagraph row-width="10%" class=" my-1 shadow-lg bg-black bg-opacity-10 rounded px-1" />
          <div class="flex flex-col justify-center items-center w-[6rem] h-[6rem] relative my-1">
            <van-circle :rate="0" :speed="100" />
            <VanSkeletonImage class="!absolute w-[calc(100%-6px)] h-[calc(100%-6px)] !rounded-full" />
          </div>
          <VanSkeletonParagraph row-width="10%" class=" my-1 shadow-lg bg-black bg-opacity-10 rounded px-1" />
          <VanSkeletonParagraph row-width="30%" class=" my-1 shadow-lg bg-black bg-opacity-10 rounded px-1" />
          <VanSkeletonParagraph row-width="80%" class=" my-1 shadow-lg bg-black bg-opacity-10 rounded px-1" />
        </div>
      </template>
    </VanSkeleton>
  </div>
</template>