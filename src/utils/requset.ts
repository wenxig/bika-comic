
import {  isEmpty,  } from "lodash-es"
import mitt from "mitt"
import { shallowReactive, type ShallowReactive } from "vue"
import eventBus from "./eventBus"
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
export const errorReturn = (err: Error, cause = '') => {
  try {
    eventBus.emit('networkError', [cause])
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
export const createStateContentData = <T>(data?: T, isLoading = false, _isEmpty = data && isEmpty(data), isError = false): StateContentData<T> => ({
  isError,
  isEmpty: _isEmpty,
  isLoading,
  data
})
export const useStateContentWithResolvers = <T>(data?: Awaited<T>, isLoading = false, _isEmpty = !data || isEmpty(data), isError = false) => {
  const base = createStateContentData<Awaited<T>>(data, isLoading, _isEmpty, isError)
  const ref: UseStateContent<T> = shallowReactive(base)
  return {
    value: ref,
    load(data?: Awaited<T>, isError = false) {
      ref.data = data
      ref.isLoading = false
      ref.isEmpty = !data || isEmpty(data)
      ref.isError = isError
    },
    reset() {
      ref.data = base.data
      ref.isLoading = base.isLoading
      ref.isEmpty = base.isEmpty
      ref.isError = base.isError
    },
    async bind(promise: Promise<Awaited<T> | undefined>) {
      ref.isLoading = true
      try {
        const result = await promise
        ref.data = result
        ref.isLoading = false
        ref.isError = false
        ref.isEmpty = !result || isEmpty(result)
        return result
      } catch {
        ref.data = undefined
        ref.isLoading = false
        ref.isError = true
        ref.isEmpty = false

      }
    }
  }
}
