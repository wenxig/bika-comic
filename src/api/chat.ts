import config, { isOnline } from "@/config"
import { useAppStore } from "@/stores"
import symbol from "@/symbol"
import { delay } from "@/utils/delay"
import { errorReturn, setValue } from "@/utils/requset"
import { until } from "@vueuse/core"
import axios, { isAxiosError, isCancel, type AxiosRequestConfig } from "axios"
import { isObject } from "lodash-es"
import dayjs from 'dayjs'
const chat = (() => {
  const chat = axios.create({
    baseURL: import.meta.env.DEV ? 'http://localhost:8787/chat' : 'https://bika.wenxig.workers.dev/chat',
    timeout: 10000,
  })
  chat.interceptors.request.use(async v => {
    await until(isOnline).toBe(true)
    const token = localStorage.getItem(symbol.chatToken)
    if (token) v.headers.Authorization = `Bearer ${token}`
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
    if (err?.request?.status == 401 && localStorage.getItem(symbol.chatToken)) {
      localStorage.setItem(symbol.chatToken, await login(JSON.parse(localStorage.getItem(symbol.chatToken)!)))
      return chat(err.config ?? {})
    }
    else if (err?.request?.status == 401 && !location.pathname.includes('auth')) {
      localStorage.removeItem(symbol.chatToken)
      return Promise.reject(err)
    }
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

interface LoginRes {
  token: string
}
export const login = async (config: AxiosRequestConfig = {}) => {
  const { data } = await chat.post<LoginRes>('/auth/signin', JSON.parse(localStorage.getItem(symbol.loginData)!), config)
  localStorage.setItem(symbol.chatToken, data.token)
  return data.token
}

interface RawRoom {
  isAvailable: boolean
  id: string
  title: string
  description: string
  minLevel: number
  minRegisterDays: number
  isPublic: boolean
  allowedCharacters: string[]
  icon: string
}
interface GetRoomRes {
  rooms: RawRoom[]
}


class Room {
  public isAvailable!: boolean
  public id!: string
  public title!: string
  public description!: string
  public minLevel!: number
  public minRegisterDays!: number
  public isPublic!: boolean
  public allowedCharacters!: string[]
  public icon!: string
  public canJoin() {
    if (!this.isAvailable) return false
    const { user } = useAppStore()
    if (!user) return false
    if (user.data.level < this.minLevel) return false
    // if (dayjs(user.data.created_time).from ()) {

    // }
    return true
  }
  constructor(v: RawRoom) {
    setValue(this, v)
  }
}
export const getChatRooms = () => {

}