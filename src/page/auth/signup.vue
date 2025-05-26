<script setup lang='ts'>
import { SignUp, signUp, login } from '@/api'
import { shallowReactive, shallowRef } from 'vue'
import loginImage from '@/assets/images/login-bg.webp'
import { createLoadingMessage } from '@/utils/message'
import { joinInPlusPlan } from '@/api/plusPlan'
import config from '@/config'
import { padStart } from 'lodash-es'
import { useMessage } from 'naive-ui'
import Popup from '@/components/popup.vue'
import symbol from '@/symbol'
import { useLocalStorage } from '@vueuse/core'
import { isAxiosError } from 'axios'
const toDay = new Date()
const formValue = shallowReactive<SignUp & Record<string, string>>({
  email: '',
  password: '',
  name: '',
  birthday: `${toDay.getFullYear()}-${padStart((toDay.getMonth() + 1).toString(), 2, '0')}-${padStart(toDay.getDate().toString(), 2, '0')}`,
  gender: 'bot',
  answer1: '',
  answer2: '',
  answer3: '',
  question1: '',
  question2: '',
  question3: ''
})
const repeatPassword = shallowRef('')

document.title = '注册 | bika'
const userLoginData = useLocalStorage(symbol.loginData, { email: '', password: '' })
const isSignupping = shallowRef(false)
async function submit() {
  if (isSignupping.value) return
  isSignupping.value = true
  const loading = createLoadingMessage('注册中')
  try {
    userLoginData.value = {
      email: formValue.email,
      password: formValue.password
    }
    await signUp(formValue)
    const { data: { data: { token } } } = await login({
      email: formValue.email,
      password: formValue.password
    })
    localStorage.setItem(symbol.loginToken, token)
    await joinInPlusPlan()
    config.value['bika.plusPlan'] = true
    loading.success()
    location.pathname = '/'
  } catch (err) {
    loading.fail()
    console.log('err', err)

    if (isAxiosError(err) && err.response) {
      if (err.response.data.message) {
        window.$message.error(err.response.data.message)
      }
      if (err.response.data.detail) {
        window.$message.error(err.response.data.detail)
      }
    }
  }
  isSignupping.value = false
}
const repeatPasswordValid = () => {
  if (repeatPassword.value != formValue.password) {
    return '密码重复错误'
  } else if (repeatPassword.value == '') {
    return '请填写密码'
  }
  return true
}
const showPicker = shallowRef(false)
</script>

<template>
  <div class="w-full h-full flex flex-col items-center overflow-y-auto">
    <Image :src="loginImage" fit="contain" />
    <van-form @submit="submit" class="w-full">
      <van-cell-group inset>
        <van-field :disabled="isSignupping" v-model="formValue.email" name="账号" label="账号" placeholder="账号"
          :rules="[{ required: true, message: '请填写账号' }]" />
        <van-field :disabled="isSignupping" v-model="formValue.name" name="用户名" label="用户名" placeholder="用户名"
          :rules="[{ required: true, message: '请填写用户名' }]" />
        <van-field :disabled="isSignupping" v-model="formValue.password" type="password" name="密码" label="密码"
          placeholder="密码" :rules="[{ required: true, message: '请填写密码' }]" />
        <van-field v-model="repeatPassword" type="password" name="重复密码" label="重复密码" placeholder="重复密码" :rules="[{
          required: true, validator: repeatPasswordValid
        }]" :disabled="isSignupping" />
        <van-field name="性别" label="性别">
          <template #input>
            <van-radio-group :disabled="isSignupping" v-model="formValue.gender" direction="horizontal">
              <van-radio name="f">男</van-radio>
              <van-radio name="m">女</van-radio>
              <van-radio name="bot">无</van-radio>
            </van-radio-group>
          </template>
        </van-field>
        <van-field v-model="formValue.birthday" is-link readonly name="生日" label="生日" placeholder="点击选择生日时间"
          @click="showPicker = true" :disabled="isSignupping" />
        <template v-for="index in 3">
          <van-field :model-value="formValue[`question${index}`]" :disabled="isSignupping"
            @update:model-value="v => formValue[`question${index}`] = v" type="text" :name="`${index}号密保问题`"
            :label="`${index}号密保问题`" :placeholder="`${index}号密保问题`" :rules="[{ required: true, message: '请填写问题' }]" />
          <van-field :model-value="formValue[`answer${index}`]" :disabled="isSignupping"
            @update:model-value="v => formValue[`answer${index}`] = v" type="text" :name="`${index}号密保答案`"
            :label="`${index}号密保答案`" :placeholder="`${index}号密保答案`" :rules="[{ required: true, message: '请填写答案' }]" />
        </template>
      </van-cell-group>
      <div class="m-4">
        <van-button round block type="primary" native-type="submit" loading-text="注册中" :loading="isSignupping"
          :disabled="isSignupping">
          提交
        </van-button>
      </div>
    </van-form>
  </div>
  <Popup v-model:show="showPicker" round closeable position="center" class="flex justify-center">
    <NDatePicker v-model:formatted-value="formValue.birthday" type="date" value-format="yyyy-MM-dd"
      @update:value="showPicker = false" panel size="large" />
  </Popup>
</template>
