import { remove } from "lodash-es"

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
    this._onAborts.push(()=>{
      fn()
      remove(this._onAborts, f => f == fn)
    })
    return () => remove(this._onAborts, f => f == fn)
  }
}
