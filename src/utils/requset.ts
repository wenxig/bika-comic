import { useAppStore } from "@/stores"
import { reactiveComputed } from "@vueuse/core"
import { flatten, isEmpty, uniqBy, } from "lodash-es"
import config from "@/config"
import symbol from "@/symbol"
import { HmacSHA256, enc } from "crypto-js"
import mitt from "mitt"
import { reactive, shallowReactive, type Reactive, type ShallowReactive } from "vue"
export function getBikaApiHeaders(pathname: string, method: string) {
  type Headers = [name: string, value: string][]
  pathname = pathname.substring(1)
  const requestTime = (new Date().getTime() / 1000).toFixed(0)
  let nonce = localStorage.getItem(symbol.loginNonce)
  if (!nonce) {
    const chars = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678"
    nonce = Array.from({ length: 32 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('').toLowerCase()
    localStorage.setItem(symbol.loginNonce, nonce)
  }
  const rawSignature = `${pathname}${requestTime}${nonce}${method}C69BAF41DA5ABD1FFEDC6D2FEA56B`.toLowerCase()
  const headers: Headers = [
    ['app-channel', '1'],
    ['app-uuid', 'webUUID'],
    ['accept', 'application/vnd.picacomic.com.v1+json'],
    ['app-platform', 'android'],
    ['Content-Type', 'application/json; charset=UTF-8'],
    ['time', requestTime],
    ['nonce', nonce],
    ['image-quality', config.value["bika.read.imageQuality"]],
    ['signature', HmacSHA256(rawSignature, '~d}$Q7$eIni=V)9\\RK/P.RM4;9[7|@/CA}b~OW!3?EV`:<>M7pddUBL5n|0/*Cn').toString(enc.Hex)],
    ['Raw-Signature', rawSignature]
  ]
  const token = localStorage.getItem(symbol.loginToken)
  if (token) headers.push(['authorization', token])
  return headers
}
export class SmartAbortController implements AbortController {
  private _controller = new AbortController()
  private mitt = mitt<{
    abort: void
  }>()
  public get signal() {
    return this._controller.signal
  };
  public abort(reason?: any): void {
    this._controller.abort(reason)
    this._controller = new AbortController()
    this.mitt.emit('abort')
  }
  public onAbort(fn: () => any) {
    this.mitt.on('abort', fn)
    return () => this.mitt.off('abort', fn)
  }
  public onAbortOnce(fn: () => any) {
    const handler = async () => {
      await fn()
      this.mitt.off('abort', handler)
    }
    this.mitt.on('abort', handler)
  }
}
export const errorReturn = (err: Error, because = '') => {
  try {
    window.$message?.error('网络错误:' + because)
  } catch { }
  return Promise.reject(err)
}
export const setValue = <T extends object, O extends (keyof T)[] = []>(v: T, v2: T, omit?: O) => {
  const _omit = new Set<O[number]>(omit)
  for (const key in v2) {
    if (_omit.has(key)) continue
    v[key] = v2[key]
  }
}

export const useMainPageLevelComicShows = () => {
  const app = useAppStore()
  const comicBoard = reactiveComputed(() => app.levelBoard.comics)
  return reactiveComputed(() => uniqBy(flatten(comicBoard.map(v => v.filter((_v, i) => i <= 2).map(comic => ({
    comic,
    level: comicBoard.map(v => v.findIndex(v => v._id == comic._id))
  })))), v => v.comic._id))
}
export const uuid = () => 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'.replace(/x/g, function (c) {
  const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8)
  return v.toString(16)
})

export type StateContentData<T> = {
  isError?: boolean
  isEmpty?: boolean
  isLoading?: boolean
  data?: T
}

export type UseStateContent<T> = ShallowReactive<StateContentData<Awaited<T>>>
export const useStateContent = <T extends Promise<any>>(promise: T, _isEmpty: (v: Awaited<T>) => boolean = isEmpty): UseStateContent<T> => {
  const v = shallowReactive<StateContentData<Awaited<T>>>({
    isError: false,
    isEmpty: false,
    isLoading: true,
    data: undefined
  })
  promise.then(val => {
    v.data = val
    v.isLoading = false
    v.isError = false
    v.isEmpty = _isEmpty(val)
  }).catch(() => {
    v.data = undefined
    v.isLoading = false
    v.isError = true
    v.isEmpty = false
  })
  return v
}

export const createStateContentData = <T>(data: T, isLoading = false, isEmpty = true, isError = false): StateContentData<T> => ({
  isError,
  isEmpty,
  isLoading,
  data
})

export const coverFunctionToStateContentData = <T extends (...arg: any[]) => Promise<any>>(fn: T, _isEmpty?: (v: Awaited<ReturnType<T>>) => boolean): (...args: Parameters<T>) => StateContentData<Awaited<ReturnType<T>>> => (...arg) => useStateContent(fn(...arg))