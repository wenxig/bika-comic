/// <reference types="vite/client" />
type SortType = 'dd' | 'da' | 'ld' | 'vd'
type SearchMode = "id" | "uploader" | "translater" | "anthor" | "keyword" | 'categories' | 'tag'

type GenericComponentExports<D extends (...p: any[]) => any> =
  import('vue').ComponentPublicInstance &
  Parameters<NonNullable<NonNullable<ReturnType<D>['__ctx']>['expose']>>[0]

type PromiseWith<T = any, O> = Promise<T> & D
declare module "virtual:pwa-register" {
  const registerSW: () => Promise<void>
}