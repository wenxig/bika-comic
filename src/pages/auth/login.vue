<script setup lang='ts'>
import { ShallowReactive, shallowReactive, shallowRef } from 'vue'
import loginImage from '@/assets/images/login-bg.webp'
import { createLoadingMessage } from '@/utils/message'
import { isAxiosError } from 'axios'
import { login, LoginData } from '@/api/bika/api/auth'
import { PromiseContent } from '@/utils/data'
import { Response } from '@/api/bika'
import { useAppStore } from '@/stores'
import { FormInst, useMessage } from 'naive-ui'
const appStore = useAppStore()
const formValue = shallowReactive<LoginData>({
  email: '',
  password: ''
})
const $message = useMessage()
const formRef = shallowRef<FormInst>()
const loginIns = shallowRef<undefined | ShallowReactive<PromiseContent<Response<{ token: string }>>>>()
async function submit() {
  // await formRef.value?.validate().catch(() => $message.error('请检查输入内容'))
  loginIns.value = login(appStore.loginData.value = formValue)
  try {
    const { data: { token } } = await createLoadingMessage('登陆中').bind(loginIns.value)
    appStore.loginToken = token
    location.pathname = '/'
  } catch (err: any) {
    if (isAxiosError(err) && err.response) {
      if (err.response.data.message) {
        $message.error(err.response.data.message)
      }
      if (err.response.data.detail) {
        $message.error(err.response.data.detail)
      }
    }
  }
}
</script>

<template>
  <div class="w-full h-full flex flex-col items-center overflow-y-auto">
    <!-- <Image :src="loginImage" fit="contain" /> -->
    <NForm ref="formRef" class="mt-5 w-full" :rules="{
      email: {
        required: true,
        message: '请输入用户名',
        trigger: 'blur'
      },
      password: {
        required: true,
        message: '请输入密码',
        trigger: 'blur'
      }
    }" :model="formValue">
      <NFormItem label="用户名" path="email">
        <NInput v-model="formValue.email" placeholder="用户名" />
      </NFormItem>
      <NFormItem label="密码" path="password">
        <NInput v-model="formValue.password" type="password" placeholder="密码" />
      </NFormItem>
      <div class="w-[calc(100%-40px)] flex justify-between px-5 items-center">
        <NButton text @click="$router.push('/auth/signup')">注册</NButton>
        <NButton text @click="$message.error('请自求多福')">忘记密码</NButton>
      </div>
      <div class="m-4">
        <NButton @click="submit" round type="primary">
          提交
        </NButton>
      </div>
    </NForm>
  </div>
</template>
