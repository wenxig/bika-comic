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
// export const errorRetryDecider = async <T extends { message: string } = any>(error: any) => {
//   if (isCancel(error)) return Promise.reject(error)
//   if (!isAxiosError<T>(error)) return Promise.reject(error)
//   if (!error?.response) return errorReturn(error, error.cause?.message)
//   if (/^[45]/g.test(<string>error?.request?.status?.toString())) return errorReturn(error, error.response.data.message)
//   if (!error.config) return errorReturn(error, error.cause?.message)
//   if (error.config.__retryCount && error.config.retry && error.config.__retryCount >= error.config.retry) return errorReturn(error, error.response.data.message)
//   error.config.__retryCount = error.config?.__retryCount ?? 0
//   error.config.__retryCount++
//   await delay(1000)
//   return true
// }