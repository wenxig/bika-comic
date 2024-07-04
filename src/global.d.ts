import { type useMessage, type useLoadingBar, type useDialog } from 'naive-ui'
declare global {
  interface Window {
    $message: ReturnType<typeof useMessage>
    $loading: ReturnType<typeof useLoadingBar>
    $dialog: ReturnType<typeof useDialog>
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