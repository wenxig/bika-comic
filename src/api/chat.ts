import config, { isOnline } from "@/config"
import { useAppStore } from "@/stores"
import symbol from "@/symbol"
import { delay } from "@/utils/delay"
import { errorReturn, setValue } from "@/utils/requset"
import { until, useLocalStorage, useWebSocket } from "@vueuse/core"
import axios, { isAxiosError, isCancel, type AxiosRequestConfig } from "axios"
import { isObject, noop } from "lodash-es"
import mitt from 'mitt'
import { ref, shallowRef, watch, type Ref } from "vue"
const chatToken = useLocalStorage(symbol.chatToken, '')
const userLoginData = useLocalStorage(symbol.loginData, { email: '', password: '' })
const chat = (() => {
  const chat = axios.create({
    baseURL: import.meta.env.DEV ? 'http://localhost:8787/chat' : 'https://bika.wenxig.workers.dev/chat',
    timeout: 10000,
  })
  chat.interceptors.request.use(async v => {
    await until(isOnline).toBe(true)
    const token = chatToken.value
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
    if (err?.request?.status == 401 && chatToken.value) {
      chatToken.value = await login(JSON.parse(chatToken.value!))
      return chat(err.config ?? {})
    }
    else if (err?.request?.status == 401 && !location.pathname.includes('auth')) {
      chatToken.value = undefined
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
  const { data } = await chat.post<LoginRes>('/auth/signin', userLoginData.value, config)
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
    return true
  }
  public join() {
    return new RoomConnection(this.id)
  }
  constructor(v: RawRoom) {
    setValue(this, v)
  }
}


type ChatMessageData = {}
class RoomConnection {
  protected ws: Ref<WebSocket | undefined>
  protected emitter = mitt<{ data: ChatMessageData }>()
  private stopDataWatch = noop
  constructor(id: string) {
    const _this = this
    const ws = useWebSocket(`${config.value["bika.proxy.chat"]}?token=${encodeURIComponent(chatToken.value)}&room=${id}`, {
      autoReconnect: true,
      autoClose: false,
      onConnected() {
        _this.isOpen.value = true
      },
      onDisconnected() {
        _this.isOpen.value = false
      }
    })
    this.ws = ws.ws
    this.stopDataWatch = watch(ws.data, data => _this.messages.value.add(data))
  }
  public close() {
    this.stopDataWatch()
    this.ws.value?.close()
  }
  public messages = ref(new Set<ChatMessageData>())
  public isOpen = shallowRef(false)
  public onData(fn: (data: ChatMessageData) => any) {
    this.emitter.on('data', fn)
  }
}

export const getChatRooms = async (config: AxiosRequestConfig = {}) => {
  const { data: { rooms } } = await chat.get<GetRoomRes>('/room/list', config)
  return rooms.map(r => new Room(r))
}