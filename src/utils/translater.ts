import { Converter } from 'opencc-js'
import { computed, toRef, type MaybeRefOrGetter } from 'vue'
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
  const data = toRef(val)
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

const translateMap: Record<string, string | [string, string]> = {
  knight: '骑士',
  manager: '管理者',
  vip: '会员',
  mcdonalds: '金拱门',
  streamer: '主包',
  anchor: '作者',
  single_dog: '单身狗(这年头谁结婚)',
  boy_ladies: '男娘(耐艹王)',
  girl: '女菩萨',
  cat_lover: '猫奴',
  kfc: '肯德基',
  girl_identifier: '女菩萨审核(近水楼台先得月)',
  patrick: '派大星',
  bubble_official: '官方',
  big_boss: '大牢板(耐权王)'
}
export const userCharactersTranslater = (character: string) => Object.hasOwn(translateMap, character) ? translateMap[character] : character