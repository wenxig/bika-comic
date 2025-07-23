import { defineStore } from "pinia"
import { ref } from "vue"

export const useImagesStore = defineStore('image', () => {
  const loaded = ref(new Set<string>())
  const error = ref(new Set<string>())
  return { loaded, error }
})