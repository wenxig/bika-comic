<script setup lang='ts'>
import { Login, login } from '@/api'
import { shallowReactive } from 'vue'
import loginImage from '@/assets/images/login-bg.png'
import { createLoadingMessage } from '@/utils/message'
import { useMessage } from 'naive-ui'
import { joinInPlusPlan } from '@/api/plusPlan'
import config from '@/config'
const formValue = shallowReactive<Login>({
  email: '',
  password: ''
})
document.title = '登陆 | bika'
async function submit() {
  const loading = createLoadingMessage('登陆中')
  try {
    localStorage.setItem('userLoginData', JSON.stringify(formValue))
    const { data: { data: { token } } } = await login(formValue)
    localStorage.setItem('token', token)
    await joinInPlusPlan()
    config.value.plusPlan = true
    loading.success()
    location.pathname = '/'
  } catch (err: any) {
    loading.fail()
    if (err?.error) useMessage().error(err.error)
  }
}
</script>

<template>
  <div class="w-full h-full flex flex-col items-center overflow-y-auto">
    <Image :src="loginImage" alt="login-bg" fit="contain" />
    <van-form @submit="submit" class="mt-5 w-full">
      <van-cell-group inset>
        <van-field v-model="formValue.email" name="用户名" label="用户名" placeholder="用户名"
          :rules="[{ required: true, message: '请填写用户名' }]" />
        <van-field v-model="formValue.password" type="password" name="密码" label="密码" placeholder="密码"
          :rules="[{ required: true, message: '请填写密码' }]" />
      </van-cell-group>
      <div class="w-[calc(100%-40px)] flex justify-between px-5 items-center">
        <span @click="$router.force.push('/auth/signup')"
          class="text-[--p-color] van-haptics-feedback no-underline">注册</span>
        <span to="/" class="text-[--p-color] van-haptics-feedback no-underline">忘记密码</span>
      </div>
      <div class="m-4">
        <van-button round block type="primary" native-type="submit">
          提交
        </van-button>
      </div>
    </van-form>
  </div>
</template>
