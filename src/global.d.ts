import { type useMessage, type useLoadingBar, type useDialog } from 'naive-ui'
declare global {
  interface Window {
    $message: ReturnType<typeof useMessage>
    $loading: ReturnType<typeof useLoadingBar>
    $dialog: ReturnType<typeof useDialog>
    $api: Record<string, any>
  }
  interface Map<K, V> {
    toJSON(): string
    toJSONObject(): [K, V][]
  }
  interface Set<T> {
    toJSON(): string
    toJSONObject(): T[]
  }
  interface Console {
    only(...arg: any[]): void
  }
}
declare module 'vue-router' {
  interface Router {
    force: {
      push: Router['push']
      replace: Router['replace']
    }
  }
}
declare module 'axios' {
  interface AxiosRequestConfig {
    __retryCount?: number
    retry?: number
  }
}
export { }