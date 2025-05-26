/// <reference types="vite/client" />
type SortType = 'dd' | 'da' | 'ld' | 'vd'
type SearchMode = "id" | "pid" | "uploader" | "translater" | "anthor" | "keyword" | 'categories' | 'tag'

type GenericComponentExports<T> = import('vue-component-type-helpers').ComponentExposed<T>

type PromiseWith<T = any, O> = Promise<T> & D

declare const __VAN_CELL_HEIGHT__ = 44