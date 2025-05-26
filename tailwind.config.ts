import type { Config } from 'tailwindcss'

export default <Config>{
  corePlugins: {
    preflight: false
  },
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
