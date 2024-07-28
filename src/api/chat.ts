import config, { isOnline } from "@/config"
import router from "@/router"
import { useAppStore } from "@/stores"
import symbol from "@/symbol"
import { delay } from "@/utils/delay"
import { errorReturn, setValue, uuid } from "@/utils/requset"
import { until, useLocalStorage, useWebSocket } from "@vueuse/core"
import axios, { isAxiosError, isCancel, type AxiosRequestConfig } from "axios"
import localforage from "localforage"
import { noop } from "lodash-es"
import mitt from 'mitt'
import type { UserSex } from "."
import { shallowReactive, shallowRef, watch, type Ref } from "vue"
const chatToken = useLocalStorage(symbol.chatToken, '')
const userLoginData = useLocalStorage(symbol.loginData, { email: '', password: '' })
const chat = (() => {
  const chat = axios.create({
    baseURL: import.meta.env.DEV ? 'http://localhost:8787/chat' : 'https://bika.wenxig.workers.dev/chat',
    timeout: 20000,
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
    if (err?.response?.status == 401 && chatToken.value) {
      chatToken.value = await login(JSON.parse(chatToken.value!))
      return chat(err.config ?? {})
    }
    else if (err?.response?.status == 401 && !location.pathname.includes('auth')) {
      chatToken.value = undefined
      await router.force.replace('/auth/login')
      return Promise.reject(err)
    }
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
const messageChat = (() => {
  const chat = axios.create({
    baseURL: import.meta.env.DEV ? 'http://localhost:8787/chat' : '/api/chat',
    timeout: 20000,
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
    if (err?.response?.status == 401 && chatToken.value) {
      chatToken.value = await login(JSON.parse(chatToken.value!))
      return chat(err.config ?? {})
    }
    else if (err?.response?.status == 401 && !location.pathname.includes('auth')) {
      chatToken.value = undefined
      await router.force.replace('/auth/login')
      return Promise.reject(err)
    }
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
window.$api.messageChat = messageChat

interface LoginRes {
  token: string
}
export const login = async (config: AxiosRequestConfig = {}) => {
  const { data } = await chat.post<LoginRes>('/auth/signin', userLoginData.value, config)
  localStorage.setItem(symbol.chatToken, data.token)
  return data.token
}

interface GetRoomRes {
  rooms: RawRoom[]
}
interface RawRoom {
  isAvailable: boolean
  id: string
  title: string
  description: string
  shortDescription: string
  minLevel: number
  minRegisterDays: number
  isPublic: boolean
  allowedCharacters: string[]
  icon: string
}

export class Room implements RawRoom {
  public isAvailable!: boolean
  public id!: string
  public title!: string
  public description!: string
  public minLevel!: number
  public minRegisterDays!: number
  public isPublic!: boolean
  public allowedCharacters!: string[]
  public icon!: string
  public shortDescription!: string
  public join() {
    return new RoomConnection(this.id)
  }
  constructor(v: RawRoom) {
    setValue(this, v)
  }
}
const chatDB = localforage.createInstance({ name: 'chat' })
export const getChatRooms = async (config: AxiosRequestConfig = {}) => {
  let roomsTemp = await chatDB.getItem<GetRoomRes>(symbol.chatRoomTemp)
  if (!roomsTemp)
    roomsTemp = (await chat.get<GetRoomRes>('/room/list', config)).data
  chatDB.setItem(symbol.chatRoomTemp, roomsTemp)
  return roomsTemp.rooms.map(r => new Room(r))
}
export class RoomConnection {
  protected ws: Ref<WebSocket | undefined>
  protected emitter = mitt<{ data: ChatMessageData, open: undefined }>()
  private stopDataWatch = noop
  constructor(protected roomId: string) {
    const _this = this
    const ws = useWebSocket<string>(`${config.value["bika.proxy.chat"]}?token=${encodeURIComponent(chatToken.value)}&room=${roomId}`, {
      autoReconnect: true,
      onConnected() {
        _this.isOpen.value = true
        _this.emitter.emit('open')
      },
      onDisconnected() {
        _this.isOpen.value = false
      },
    })
    window.$api.chatRoomWs = this.ws = ws.ws
    this.stopDataWatch = watch(ws.data, _data => {
      if (!_data) return
      const data = createChatMessageData(JSON.parse(_data))
      // console.log('msg data:', _data)
      if (data instanceof ChatInitMessage) {
        _this.messages.splice(0, Infinity)
        _this.messages.push(...data.data.messages)
      }
      else _this.messages.push(data)
      this.emitter.emit('data', data)
    })
  }
  public close() {
    this.stopDataWatch()
    this.ws.value!.close()
  }
  public messages = shallowReactive(new Array<ChatMessageData>())
  public isOpen = shallowRef(false)
  public onData(fn: (data: ChatMessageData) => any) {
    this.emitter.on('data', fn)
  }
  public onOpen(fn: () => any) {
    this.emitter.on('open', fn)
  }
  public sendText(message: string, mentions: string[]) {
    messageChat.post('/message/send-message', {
      roomId: this.roomId,
      message,
      referenceId: uuid(),
      userMentions: mentions,
    })
  }
  public sendImage(img: File, mentions: string[]) {
    const formData = new FormData()
    formData.append('roomId', this.roomId)
    formData.append('caption', '')
    formData.append('referenceId', uuid())
    formData.append('userMentions', JSON.stringify(mentions))
    formData.append('medias', img, img.name)
    chat.post('/message/send-image', formData)
  }
  public sendAudio(audio: File, mentions: string[]) {
    const formData = new FormData()
    formData.append('roomId', this.roomId)
    formData.append('caption', '')
    formData.append('referenceId', uuid())
    formData.append('userMentions', JSON.stringify(mentions))
    formData.append('medias', audio, audio.name)
    chat.post('/message/send-audio', formData)
  }
}
const userBase = new Array<ChatUserProfile>()
export const getUser = (id: string) => userBase.find(v => v.id == id)
interface RawChatUserProfile {
  totalBlocked: number
  id: string
  email: '***'
  name: string
  birthday: string
  gender: UserSex
  slogan: string
  title: string
  level: number
  exp: number
  role: string
  characters: string[]
  created_at: string
  avatarUrl: string
}
export class ChatUserProfile implements RawChatUserProfile {
  public totalBlocked!: number
  public id!: string
  public readonly email = '***'
  public name!: string
  public birthday!: string
  public gender!: UserSex
  public slogan!: string
  public title!: string
  public level!: number
  public exp!: number
  public role!: string
  public characters!: string[]
  public created_at!: string
  public get created_time() {
    return new Date(this.created_at)
  }
  public avatarUrl!: string
  constructor(p: RawChatUserProfile) {
    setValue(this, p)
    userBase.push(this)
  }
}
const useProfile = (pf: RawChatUserProfile) => {
  let profileIndex: number
  const profile = userBase.find((v, index) => {
    if (v.id == pf.id) {
      profileIndex = index
      return true
    }
  })
  if (!profile) {
    new ChatUserProfile(pf)
    var _profileIndex = userBase.length - 1
  }
  else var _profileIndex = profileIndex!
  return _profileIndex
}


interface RawChatMessage {
  type: string
}
interface RawChatUserMessage extends RawChatMessage {
  isBlocked: boolean
  id: string
  roomId: string
  referenceId: string
  createdAt: string
  type: string
}
export abstract class ChatBaseMessage implements RawChatUserMessage {
  public isBlocked!: boolean
  public id!: string
  public roomId!: string
  public referenceId!: string
  public createdAt!: string
  public get created_time() {
    return new Date(this.createdAt)
  }
  public abstract type: string
}
interface UserMentions {
  id: string,
  name: string
}

interface RawBaseUserReply {
  id: string
  userId: string
  type: string
}
class BaseUserReply implements RawBaseUserReply {
  public id!: string
  public userId!: string
  public type!: string
}
interface RawChatReplyTextMessage extends RawBaseUserReply {
  id: string
  userId: string
  type: 'TEXT_MESSAGE'
  data: {
    message: string
    name: string
  }
}
export class ChatReplyTextMessage extends BaseUserReply implements RawChatReplyTextMessage {
  public readonly type = 'TEXT_MESSAGE'
  public data!: {
    message: string
    name: string
  }
  constructor(p: RawChatReplyTextMessage) {
    super()
    setValue(this, p)
  }
}
interface RawChatReplyImageMessage extends RawBaseUserReply {
  id: string
  userId: string
  type: 'IMAGE_MESSAGE'
  data: {
    caption: null | string,
    name: string,
    media: string
  }
}
export class ChatReplyImageMessage extends BaseUserReply implements RawChatReplyImageMessage {
  public readonly type = "IMAGE_MESSAGE"
  public data!: {
    caption: null | string
    name: string,
    media: string
  }
  constructor(p: RawChatReplyImageMessage) {
    super()
    setValue(this, p)
  }
}
interface RawChatReplyInstantImageMessage extends RawBaseUserReply {
  id: string
  userId: string
  type: 'INSTANT_IMAGE_MESSAGE'
  data: {
    message: '閃照',
    name: string
  }
}
export class ChatReplyInstantImageMessage extends BaseUserReply implements RawChatReplyInstantImageMessage {
  public readonly type = "INSTANT_IMAGE_MESSAGE"
  public data!: {
    message: '閃照',
    name: string
  }
  constructor(p: RawChatReplyInstantImageMessage) {
    super()
    setValue(this, p)
  }
}

interface RawChatReplyAudioMessage extends RawBaseUserReply {
  id: string
  userId: string
  type: 'AUDIO_MESSAGE'
  data: {
    caption: null | string,
    name: string
  }
}
export class ChatReplyAudioMessage extends BaseUserReply implements RawChatReplyAudioMessage {
  public readonly type = "AUDIO_MESSAGE"
  public data!: {
    caption: null | string,
    name: string
  }
  constructor(p: RawChatReplyAudioMessage) {
    super()
    setValue(this, p)
  }
}

type RawChatReply = RawChatReplyTextMessage | RawChatReplyImageMessage | RawChatReplyInstantImageMessage | RawChatReplyAudioMessage
type ChatReply = ChatReplyTextMessage | ChatReplyImageMessage | ChatReplyInstantImageMessage | ChatReplyAudioMessage
const createChatMessageReply = (reply?: RawChatReply): ChatReply | undefined => {
  if (!reply) return
  switch (reply.type) {
    case 'TEXT_MESSAGE': return new ChatReplyTextMessage(reply)
    case "IMAGE_MESSAGE": return new ChatReplyImageMessage(reply)
    case "INSTANT_IMAGE_MESSAGE": return new ChatReplyInstantImageMessage(reply)
    case "AUDIO_MESSAGE": return new ChatReplyAudioMessage(reply)
    default: {
      console.error('unknown reply type:', reply)
      return reply
    }
  }
}



interface RawChatTextMessage extends RawChatUserMessage {
  type: 'TEXT_MESSAGE'
  data: {
    message: string
    profile: Readonly<RawChatUserProfile>
    userMentions: UserMentions[]
    reply?: RawChatReply
  }
}
export class ChatTextMessage extends ChatBaseMessage implements RawChatTextMessage {
  public readonly type = 'TEXT_MESSAGE'
  private _data!: {
    message: string
    profile: Readonly<ChatUserProfile>
    userMentions: UserMentions[]
    reply?: ChatReply
    _profileIndex: number
  }
  public set data(data: typeof this._data) {
    const _profileIndex = useProfile(data.profile)
    this._data = {
      ...data,
      reply: createChatMessageReply(data.reply),
      _profileIndex,
      get profile() {
        return userBase[this._profileIndex]
      }
    }
  }
  public get data() {
    return this._data
  }
  constructor(params: RawChatTextMessage) {
    super()
    setValue(this, params)
  }
}
interface RawChatImageMessage extends RawChatUserMessage {
  type: 'IMAGE_MESSAGE'
  data: {
    isInstantImage: false
    caption: string
    medias: [string]
    profile: Readonly<ChatUserProfile>
    userMentions: UserMentions[]
    reply?: RawChatReply
  }
}
export class ChatImageMessage extends ChatBaseMessage implements RawChatImageMessage {
  public readonly type = 'IMAGE_MESSAGE'
  private _data!: {
    isInstantImage: false
    caption: string
    medias: [string]
    profile: Readonly<ChatUserProfile>
    userMentions: UserMentions[]
    reply?: ChatReply
    _profileIndex: number
  }
  public set data(data: typeof this._data) {
    const _profileIndex = useProfile(data.profile)
    this._data = {
      ...data,
      reply: createChatMessageReply(data.reply),
      _profileIndex,
      get profile() {
        return userBase[this._profileIndex]
      }
    }
  }
  public get data() {
    return this._data
  }
  constructor(params: RawChatImageMessage) {
    super()
    setValue(this, params)
  }
}
interface RawChatInstantImageMessage extends RawChatUserMessage {
  type: 'INSTANT_IMAGE_MESSAGE'
  data: {
    isInstantImage: true
    caption: string
    medias: [string]
    profile: Readonly<ChatUserProfile>
    userMentions: UserMentions[]
    reply?: RawChatReply
  }
}
export class ChatInstantImageMessage extends ChatBaseMessage implements RawChatInstantImageMessage {
  public readonly type = 'INSTANT_IMAGE_MESSAGE'
  private _data!: {
    isInstantImage: true
    caption: string
    medias: [string]
    profile: Readonly<ChatUserProfile>
    userMentions: UserMentions[]
    reply?: ChatReply
    _profileIndex: number
  }
  public set data(data: typeof this._data) {
    const _profileIndex = useProfile(data.profile)
    this._data = {
      ...data,
      reply: createChatMessageReply(data.reply),
      _profileIndex,
      get profile() {
        return userBase[this._profileIndex]
      }
    }
  }
  public get data() {
    return this._data
  }
  constructor(params: RawChatInstantImageMessage) {
    super()
    setValue(this, params)
  }
}
interface RawChatAudioMessage extends RawChatUserMessage {
  type: 'AUDIO_MESSAGE'
  data: {
    profile: Readonly<ChatUserProfile>
    userMentions: UserMentions[]
    audio: string,
    duration: number,
    reply: ChatReply
  }
}
export class ChatAudioMessage extends ChatBaseMessage implements RawChatAudioMessage {
  public readonly type = 'AUDIO_MESSAGE'
  private _data!: {
    profile: Readonly<ChatUserProfile>
    userMentions: UserMentions[]
    audio: string,
    duration: number,
    _profileIndex: number,
    reply: ChatReply
  }
  public set data(data: typeof this._data) {
    const _profileIndex = useProfile(data.profile)
    this._data = {
      ...data,
      _profileIndex,
      get profile() {
        return userBase[this._profileIndex]
      }
    }
  }
  public get data() {
    return this._data
  }
  constructor(params: RawChatAudioMessage) {
    super()
    setValue(this, params)
  }
}
export const isUserMessage = (v: ChatMessageData): v is ChatTextMessage | ChatImageMessage | ChatInstantImageMessage | ChatAudioMessage => v instanceof ChatTextMessage || v instanceof ChatImageMessage || v instanceof ChatInstantImageMessage || v instanceof ChatAudioMessage


interface RawChatInitMessage extends RawChatMessage {
  type: "INITIAL_MESSAGES"
  data: {
    messages: RawChatMessageData[]
    total: number
    subTotal: number
  }
  onlineCount: number
}
export class ChatInitMessage implements RawChatInitMessage {
  public readonly type = "INITIAL_MESSAGES"
  private _data!: {
    messages: ChatMessageData[]
    total: number
    subTotal: number
  }
  public set data(data: typeof this._data) {
    this._data = {
      ...data,
      messages: data.messages.map(createChatMessageData)
    }
  }
  public get data() {
    return this._data
  }
  public onlineCount!: number
  constructor(p: RawChatInitMessage) {
    setValue(this, p)
  }
}
interface RawChatConnectedMessage extends RawChatMessage {
  type: "CONNECTED"
  data: {
    data: string
  }
}
export class ChatConnectedMessage implements RawChatConnectedMessage {
  public readonly type = "CONNECTED"
  private _data!: {
    data: string
    time: Date
  }
  public set data(data: RawChatConnectedMessage['data']) {
    this._data = {
      ...data,
      time: new Date(data.data)
    }
  }
  public get data(): typeof this._data {
    return this.data
  }
  constructor(p: RawChatConnectedMessage) {
    setValue(this, p)
  }
}
interface RawLiveMessage extends RawChatMessage {
  type: "PODCAST_IS_LIVE_ACTION",
  isBlocked: boolean,
  data: {
    roomId: string,
    isLive: boolean
  }
}
export class LiveMessage implements RawLiveMessage {
  public readonly type = "PODCAST_IS_LIVE_ACTION"
  public isBlocked!: boolean
  public data!: {
    roomId: string
    isLive: boolean
  }
  constructor(p: RawLiveMessage) {
    setValue(this, p)
  }
}
interface RawUserCountMessage extends RawChatMessage {
  type: 'UPDATE_ROOM_ONLINE_USERS_COUNT_ACTION'
  isBlocked: boolean
  data: {
    roomId: string
    onlineCount: number
  }
}
export class UserCountMessage implements RawUserCountMessage {
  public readonly type = "UPDATE_ROOM_ONLINE_USERS_COUNT_ACTION"
  public isBlocked!: boolean
  public data!: { roomId: string; onlineCount: number }
  constructor(parameters: RawUserCountMessage) {
    setValue(this, parameters)
  }
}


export type RawChatMessageData = RawChatInitMessage | RawChatTextMessage | RawChatConnectedMessage | RawLiveMessage | RawUserCountMessage | RawChatImageMessage | RawChatInstantImageMessage | RawChatAudioMessage
export type ChatMessageData = ChatInitMessage | ChatTextMessage | ChatConnectedMessage | LiveMessage | UserCountMessage | ChatImageMessage | ChatInstantImageMessage | ChatAudioMessage
const createChatMessageData = (msg: RawChatMessageData): ChatMessageData => {
  switch (msg.type) {
    case 'TEXT_MESSAGE': return new ChatTextMessage(msg)
    case "IMAGE_MESSAGE": return new ChatImageMessage(msg)
    case "INSTANT_IMAGE_MESSAGE": return new ChatInstantImageMessage(msg)
    case "AUDIO_MESSAGE": return new ChatAudioMessage(msg)

    case "INITIAL_MESSAGES": return new ChatInitMessage(msg)
    case "CONNECTED": return new ChatConnectedMessage(msg)
    case "PODCAST_IS_LIVE_ACTION": return new LiveMessage(msg)
    case "UPDATE_ROOM_ONLINE_USERS_COUNT_ACTION": return new UserCountMessage(msg)

    default: {
      console.error('unknown message type:', msg)

      return msg
    }
  }
}