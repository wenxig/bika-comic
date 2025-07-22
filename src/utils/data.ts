import { until } from "@vueuse/core"
import { isEmpty, isError, last } from "lodash-es"
import { ref, shallowReactive, shallowRef, type Ref, type ShallowReactive } from "vue"
import { SmartAbortController } from "./request"
import type { Response, RawStream, SortType } from "@/api/bika"
import type { BaseComic } from "@/api/bika/comic"

export class PromiseContent<T> implements Promise<T> {
  constructor(private promise: Promise<T>, _isEmpty: (v: Awaited<T>) => boolean = isEmpty) {
    this[Symbol.toStringTag] = promise[Symbol.toStringTag]
    promise.then(async val => {
      const v = await val
      this.data = v
      this.isLoading = false
      this.isError = false
      this.isEmpty = _isEmpty(v)
    })
    promise.catch(err => {
      this.data = undefined
    })
  }
  [Symbol.toStringTag] = ''
  public catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined): Promise<T | TResult> {
    return this.promise.catch<TResult>(onrejected)
  }
  public then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined): Promise<TResult1 | TResult2> {
    return this.promise.then<TResult1, TResult2>(onfulfilled)
  }
  public finally(onfinally?: (() => void) | null | undefined): Promise<T> {
    return this.promise.finally(onfinally)
  }
  public data?: T
  public isLoading = true
  public isError = false
  public isEmpty = false
  public static fromPromise<T>(promise: Promise<T>, _isEmpty: (v: Awaited<T>) => boolean = isEmpty) {
    const v = new this<T>(promise, _isEmpty)
    return shallowReactive(v)
  }
  public static fromAsyncFunction<T extends (...args: any[]) => Promise<any>>(asyncFunction: T, _isEmpty: (v: Awaited<T>) => boolean = isEmpty) {
    return (...args: Parameters<T>): ShallowReactive<PromiseContent<Awaited<ReturnType<T>>>> => this.fromPromise((()=>{
      console.log('called', asyncFunction)
      return asyncFunction(...args)
    })())
  }
}
export class Stream<T> implements AsyncIterableIterator<T[], T[]> {
  private abortController = new SmartAbortController()
  constructor(generator: (abortSignal: AbortSignal, that: Stream<T>) => (IterableIterator<T[], T[], Stream<T>> | AsyncIterableIterator<T[], T[], Stream<T>>)) {
    this.generator = generator(this.abortController.signal, this)
  }
  private generator
  public async next(): Promise<IteratorResult<T[], T[]>> {
    try {
      await until(this.isLoading).toBe(false)
      this.isLoading.value = true
      if (this._isDone) return { done: true, value: [last(this.data.value)!] }
      const { value, done } = await this.generator.next(this)
      this.isDone.value = done ?? false
      this.data.value.push(...value)
      this.isLoading.value = false
      return { value, done }
    } catch (error) {
      if (isError(error)) this.error.value = error
      throw error
    }
  }
  public async return(value?: T[] | PromiseLike<T[]>): Promise<IteratorResult<T[], T[]>> {
    const val = await value
    return await this.generator.return?.(val) ?? { value: val ?? [], done: this._isDone }
  }
  public async throw(e?: any): Promise<IteratorResult<T[], T[]>> {
    return await this.generator.throw?.(e) ?? { value: [last(this.data.value)!], done: this._isDone }
  }
  public reset() {
    this.total.value = NaN
    this.page.value = 0
    this.data.value = []
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
  public data = ref<T[]>([]) as Ref<T[]>
  /** 当前页 */
  public page = shallowRef(0)
  public get _page() {
    return this.page.value
  }
  /** 总页数 */
  public pages = shallowRef(0)
  public get _pages() {
    return this.pages.value
  }
  /** 总条目数 */
  public total = shallowRef(NaN)
  public get _total() {
    return this.total.value
  }
  /** 单页条目数 */
  public pageSize = shallowRef(NaN)
  public get _pageSize() {
    return this.pageSize.value
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
export const createClassFromResponse = async <T extends RawStream<any>, C>(v: ShallowReactive<PromiseContent<Response<{ comics: T }>>>, box: new (data: T['docs'][number]) => C): Promise<RawStream<C>> => {
  const { data: { comics } } = await v
  comics.docs = comics.docs.map(v => new box(v))
  return comics
}

export const createComicStream = <T extends BaseComic>(keyword: string, sort: SortType, fn: (keyword: string, page: number, sort: SortType, signal: AbortSignal) => ShallowReactive<PromiseContent<RawStream<T>>>) =>
  new Stream(async function* (signal, that) {
    const getComic = async () => {
      const result = await fn(keyword, that.page.value, sort, signal)
      that.pages.value = result.pages
      that.total.value = result.total
      that.pageSize.value = result.limit
      that.page.value = Number(result.page)
      return result.docs
    }
    while (true) {
      if (that.pages.value == that.page.value) break
      yield await getComic()
    }
    return await getComic()
  })