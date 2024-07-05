import config, { isOnline } from "@/config"
import { useAppStore } from "@/stores"
import { delay } from "@/utils/delay"
import { errorReturn } from "@/utils/requset"
import { until } from "@vueuse/core"
import axios, { isAxiosError, isCancel } from "axios"
import { isObject } from "lodash-es"

const chat = (() => {
  const chat = axios.create({
    baseURL: import.meta.env.DEV ? 'http://localhost:8787/chat' : 'https://bika.wenxig.workers.dev/chat',
    timeout: 10000,
  })
  chat.interceptors.request.use(async v => {
    await until(isOnline).toBe(true)
    return v
  })
  chat.interceptors.response.use(v => {
    if (config.value['bika.devMode']) {
      const app = useAppStore()
      const base = app.devData.get('chatApi') ?? {
        name: '聊天api',
        data: []
      }
      base.data.push(v)
      app.devData.set('chatApi', base)
    }
    return v
  }, async err => {
    if (isCancel(err)) return Promise.reject(err)
    if (!isAxiosError<{
      message: any,
      code: number
    }>(err)) return Promise.reject(err)
    if (isObject(err?.request?.data)) return Promise.reject(err)
    if (!err.config) return Promise.reject(err)
    if (/^[45]/g.test(err.status?.toString() ?? '')) return errorReturn(err, err.response?.data.message ?? err.message)
    if (err.config.__retryCount && err.config.retry && err.config.__retryCount >= err.config.retry) return errorReturn(err, err.response?.data.message ?? err.message)
    err.config.__retryCount = err.config?.__retryCount ?? 0
    err.config.__retryCount++
    // 重新发起请求
    await delay(1000)
    return chat(err.config)
  })
  chat.defaults.retry = 10 //重试次数
  return chat
})()

window.$api.chat = chat