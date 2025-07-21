import { until } from "@vueuse/core"
import { isEmpty, last } from "lodash-es"
import { shallowReactive, shallowRef, toRaw, toRef, type Ref } from "vue"
import { SmartAbortController } from "./request"
export class Struct<T extends object> {
  constructor(data: T) {
    Object.assign(this, data)
  }
  public toJSON() {
    const data = {
      ...this,
      toJSON: undefined,
      toRef: undefined
    }
    return toRaw(data) as T
  }
  public toRef() {
    return toRef(this) as Ref<this & T, this & T>
  }
  public static create<T extends object>(data: T) {
    return new this<T>(data) as (Struct<T> & T)
  }
}

export class PromiseContent<T extends object> {
  constructor(promise: Promise<T>, _isEmpty: (v: Awaited<T>) => boolean = isEmpty) {
    promise.then(async val => {
      const v = await val
      this.data = Struct.create(v)
      this.isLoading = false
      this.isError = false
      this.isEmpty = _isEmpty(v)
    })
    promise.catch(() => {
      this.data = undefined
      this.isLoading = false
      this.isError = true
      this.isEmpty = false
    })
  }
  public data?: Struct<Awaited<T>>
  public isLoading = true
  public isError = false
  public isEmpty = false
  public static fromPromise<T extends object>(promise: Promise<T>, _isEmpty: (v: Awaited<T>) => boolean = isEmpty) {
    const v = new this<T>(promise, _isEmpty)
    return shallowReactive(v)
  }
}
export class Stream<T extends object> implements AsyncIterableIterator<T, T> {
  private abortController = new SmartAbortController()
  constructor(generator: (abortSignal: AbortSignal) => (IterableIterator<T, T, Stream<T>> | AsyncIterableIterator<T, T, Stream<T>>)) {
    this.generator = generator(this.abortController.signal)
  }
  private generator
  public async next(): Promise<IteratorResult<T, T>> {
    await until(this.isLoading).toBe(false)
    this.isLoading.value = true
    if (this._isDone) throw new Error('Stream is done')
    const { value, done } = await this.generator.next(this)
    this.isDone.value = done ?? false
    this.data.value.push(value)
    this.isLoading.value = false
    return { value, done }
  }
  public async return(value?: T | PromiseLike<T>): Promise<IteratorResult<T, T>> {
    const val = (await value) ?? last(this.data.value)!
    return await this.generator.return?.(val) ?? { value: val, done: this._isDone }
  }
  public async throw(e?: any): Promise<IteratorResult<T, T>> {
    return await this.generator.throw?.(e) ?? { value: last(this.data.value)!, done: this._isDone }
  }
  public reset() {
    this.total.value = NaN
    this.page.value = 0
    this.data.value = Struct.create([])
  }
  public async retry() {
    if (!this.error.value) return
    this.page.value--
    return this.next()
  }
  public stop() {
    this.abortController.abort()
    this.isLoading.value = false
  }
  public [Symbol.asyncIterator]() {
    return this
  }
  public error = shallowRef<void | Error>()
  public data = Struct.create<T[]>([]).toRef()
  public page = shallowRef(0)
  public get _page() {
    return this.page.value
  }
  public total = shallowRef(NaN)
  public get _total() {
    return this.total.value
  }
  public isLoading = shallowRef(false)
  public get _isRequesting() {
    return this.isLoading.value
  }
  public isDone = shallowRef(false)
  public get _isDone() {
    return this.isDone.value
  }
}