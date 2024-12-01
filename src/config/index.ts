import { computed, ref } from "vue"
import { useFullscreen, usePreferredDark } from "@vueuse/core"
import { useOnline } from '@vueuse/core'
import symbol from "@/symbol"
import { UserConfig } from "@/api/plusPlan"

export const isOnline = useOnline()
export interface FillerTag {
  name: string
  mode: "unshow" | "show" | "auto"
}

const config = ref(UserConfig.getFromDB())

const isSystemDark = usePreferredDark()
export const isDark = computed(() => config.value['bika.darkMode'] || isSystemDark.value)
localStorage.setItem(symbol.config, JSON.stringify(config.value))
export default config

export const fullscreen = useFullscreen()