import { isCancel, isAxiosError, type AxiosError } from "axios"
import { remove } from "lodash-es"
import { delay } from "./delay"

export class SmartAbortController implements AbortController {
  private _controller = new AbortController()
  public get signal() {
    return this._controller.signal
  };
  public abort(reason?: any): void {
    this._controller.abort(reason)
    this._controller = new AbortController()
    for (const fn of this._onAborts) fn()
  }
  private _onAborts: Function[] = []
  public onAbort(fn: Function) {
    this._onAborts.push(fn)
    return () => remove(this._onAborts, f => f == fn)
  }
  public onAbortOnce(fn: Function) {
    this._onAborts.push(() => {
      fn()
      remove(this._onAborts, f => f == fn)
    })
    return () => remove(this._onAborts, f => f == fn)
  }
}
export const errorReturn = (err: Error, because = '') => {
  try {
    window.$message?.error('网络错误:' + because)
  } catch { }
  return Promise.reject(err)
}
export const setValue = <T extends object>(v: T, v2: T) => {
  for (const key in v2) {
    const element = v2[key]
    if (element) v[key] = element
  }
}