import { isFunction } from 'lodash-es';
import { Converter } from 'opencc-js';
import { computed, isRef, toRef, type MaybeRefOrGetter } from 'vue';
export const toCn = Converter({ from: 'tw', to: 'cn' })
export const toTw = Converter({ from: 'cn', to: 'tw' })
export const sorterValue: {
  text: string,
  value: SortType
}[] = [{ text: '新到旧', value: 'dd' }, { text: '旧到新', value: 'da' }, { text: '点赞数最多', value: 'ld' }, { text: '观看数最多', value: 'vd' }]
export const modeMap = {
  uploader: '@@@',
  translater: '@@',
  anthor: '@',
  id: '###',
  tag: '##',
  categories: '#',
  keyword: ''
} as Record<SearchMode, string>

export const useSearchMode = (val: MaybeRefOrGetter<string>) => {
  const data = computed(() => isRef(val) ? val.value : isFunction(val) ? val() : val)
  return computed<SearchMode>(() => {
    if (data.value.startsWith(modeMap.uploader)) return 'uploader'
    if (data.value.startsWith(modeMap.translater)) return 'translater'
    if (data.value.startsWith(modeMap.anthor)) return 'anthor'
    if (data.value.startsWith(modeMap.id)) return 'id'
    if (data.value.startsWith(modeMap.tag)) return 'tag'
    if (data.value.startsWith(modeMap.categories)) return 'categories'
    return 'keyword'
  })
}