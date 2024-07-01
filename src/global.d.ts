import { type useMessage, type useLoadingBar } from 'naive-ui'
declare global {
  interface Window {
    $message: ReturnType<typeof useMessage>
    $loading: ReturnType<typeof useLoadingBar>
    $api: Record<string, any>
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
export { }