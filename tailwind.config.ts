export default {
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
} as import('tailwindcss').Config
