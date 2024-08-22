<script setup lang='ts'>
import { useSearchMode } from '@/utils/translater'

const $props = defineProps<{
  text: string
}>()
const searchMode = useSearchMode(() => $props.text)
</script>

<template>
  <VanTag type="primary" v-if="searchMode != 'keyword'" class="text-nowrap">
    <VanIcon :name="searchMode == 'anthor' ? 'user-o' :
      searchMode == 'tag' ? 'apps-o' :
        searchMode == 'categories' ? 'apps-o' :
          searchMode == 'translater' ? 'user-o' :
            searchMode == 'uploader' ? 'user-o' :
              searchMode == 'id' ? 'description-o' : ''" size="0.8rem" />
    {{ searchMode == 'anthor' ? '作者' :
      searchMode == 'tag' ? '标签' :
        searchMode == 'categories' ? '分类' :
          searchMode == 'translater' ? '汉化' :
            searchMode == 'uploader' ? '骑士' :
              searchMode == 'id' ? 'ID' : ''
            }}
  </VanTag>
</template>