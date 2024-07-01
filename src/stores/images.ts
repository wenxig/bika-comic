import { defineStore } from "pinia"
import { ref } from "vue"

export const useImagesStore = defineStore('image', () => {
  const loaded = ref(new Set<string>())
  // watch(loaded, loaded => {
  //   if (loaded.length > 50) loaded.shift()
  // })
  const error = ref(new Set<string>())
  return { loaded, error }
})