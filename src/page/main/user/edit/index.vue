<script setup lang='ts'>
import VuePictureCropper, { cropper } from 'vue-picture-cropper'
import { editAvator, editSlogan, UserProfile } from '@/api'
import { useAppStore } from '@/stores'
import { createLoadingMessage } from '@/utils/message'
import { computedWithControl, until, useFileDialog } from '@vueuse/core'
import { noop } from 'lodash-es'
import { computed, reactive, shallowRef } from 'vue'
import userIcon from '@/assets/images/userIcon.png?url'
import { showImagePreview } from '@/utils/image'
document.title = '编辑 | 用户 | bika'
const app = useAppStore()
if (!app.user()) var loadingSuccess: Function = createLoadingMessage().success
else var loadingSuccess: Function = noop
await until(() => app.user()?.data).not.toBeUndefined()
loadingSuccess()
const slogan = shallowRef(app.user()?.data.slogan || '')
class AvatorEditor {
  public static show = shallowRef(false)
  public static option = reactive({
    boxStyle: {},
    base: {
      viewMode: 1,
      dragMode: 'move',
      aspectRatio: 1,
    },
    img: '',
    isReady: false
  })
  public static changeScale(num: number = 1) { cropper?.zoom(num) }
  public static rotate(reg = 90) { cropper?.rotate(reg) }
  public static isUpdating = shallowRef(false)
  public static async updateImg() {
    AvatorEditor.isUpdating.value = true
    const loading = createLoadingMessage('上传中')
    try {
      if (!cropper) throw new Error()
      await editAvator(cropper.getDataURL())
      AvatorEditor.show.value = false
      await app.$reload.me()
      loading.success()
    } catch {
      loading.fail()
    }
    AvatorEditor.isUpdating.value = false
  }
  public static down() {
    const aLink = document.createElement('a')
    aLink.download = 'author-img'
    cropper?.getFile().then((data) => {
      aLink.href = window.URL.createObjectURL(data!)
      aLink.click()
    })
  }
}
const uploadToAvatorEditor = async () => {
  const image = await new Promise<File>(r => {
    const filer = useFileDialog({
      accept: 'image/*',
      reset: true
    })
    filer.open()
    filer.onChange(fl => {
      if (fl) r(fl[0])
      filer.reset()
    })
  })
  const translate = await new Promise<string>(r => {
    const fr = new FileReader()
    fr.onloadend = ({ target }) => r(target!.result!.toString())
    fr.readAsDataURL(image)
  })
  AvatorEditor.option.img = translate
  AvatorEditor.show.value = true
}
const isEdittingSlogan = shallowRef(false)
const _editSlogan = async () => {
  isEdittingSlogan.value = true
  const loading = createLoadingMessage('提交中')
  try {
    await editSlogan(slogan.value)
    await app.$reload.me()
    loading.success()
  } catch {
    loading.fail()
  }
  isEdittingSlogan.value = false
}
</script>

<template>
  <VanNavBar left-arrow @click-left="$router.back()" title="编辑" />
  <div>
    <van-popover :actions="[{ text: '修改' }, { text: '查看' }]"
      @select="({ text }) => text == '修改' ? uploadToAvatorEditor() : app.user() && showImagePreview([app.user()!.data.avatar.getUrl()])">
      <template #reference>
        <VanCell title="头像" clickable>
          <template #right-icon>
            <Image :src="app.user()?.data.avatar" round class="h-[60px] w-[60px]" />
          </template>
        </VanCell>
      </template>
    </van-popover>
    <van-field class="my-2" v-model="slogan" type="textarea" rows="1" autosize label="简介" placeholder="null"
      label-align="top" />
    <VanButton block class="w-[98%] mx-auto" size="normal" type="primary" @click="_editSlogan()" :loading="isEdittingSlogan">提交简介更新</VanButton>
  </div>
  <Popup v-model:show="AvatorEditor.show.value" closeable class="flex flex-col w-[90vw] py-5 h-[115vw]">
    <NSpin :show="!AvatorEditor.option.isReady" class="w-[90%] m-auto">
      <VuePictureCropper :box-style="AvatorEditor.option.boxStyle" :img="AvatorEditor.option.img || userIcon"
        :options="AvatorEditor.option.base" @ready="AvatorEditor.option.isReady = true" />
    </NSpin>
    <div class="text-center w-full flex justify-evenly *:*:-mx-[2px]">
      <VanButton icon="plus" round plain type="primary" @click="AvatorEditor.changeScale()"
        :loading="AvatorEditor.isUpdating.value" />
      <VanButton icon="minus" round plain type="primary" @click="AvatorEditor.changeScale(-1)"
        :loading="AvatorEditor.isUpdating.value" />
      <VanButton icon="replay" round plain type="primary" @click="AvatorEditor.rotate(-90)"
        :loading="AvatorEditor.isUpdating.value" />
      <VanButton round plain type="primary" @click="AvatorEditor.down()" :loading="AvatorEditor.isUpdating.value">
        <template #icon>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" class="w-5 -mx-[1px]">
            <path fill="currentColor"
              d="M160 832h704a32 32 0 1 1 0 64H160a32 32 0 1 1 0-64m384-253.696 236.288-236.352 45.248 45.248L508.8 704 192 387.2l45.248-45.248L480 584.704V128h64z">
            </path>
          </svg>
        </template>
      </VanButton>
      <VanButton :loading="AvatorEditor.isUpdating.value" icon="success" round plain type="success"
        @click="AvatorEditor.updateImg()" />
    </div>
  </Popup>
</template>
<style scoped lang='scss'>
:deep(.van-popover__wrapper) {
  width: 100% !important;
}
</style>