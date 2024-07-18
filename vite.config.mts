import { fileURLToPath, URL } from 'node:url'
import { VantResolver } from '@vant/auto-import-resolver'
import postCssPxToRem from "postcss-pxtorem"
import autoprefixer from "autoprefixer"
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import Components from 'unplugin-vue-components/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import tailwindcss from 'tailwindcss'
import vueJsx from '@vitejs/plugin-vue-jsx'
import legacyPlugin from '@vitejs/plugin-legacy'
import _package from './package.json'
import tailwindConfig from './tailwind.config.ts'

export default defineConfig(({ command }) => ({
  plugins: [
    vue(),
    vueJsx(),
    Components({
      resolvers: [
        VantResolver(),
        NaiveUiResolver()
      ],
    }),
    VitePWA({
      includeAssets: ['favicon.png'],
      manifest: {
        name: _package.name,
        start_url: './',
        short_name: _package.name,
        icons: [{
          src: 'favicon.png',
          sizes: "512x512",
          type: "image/png",
          purpose: "any",
        }],
        theme_color: '#000000',
        display: 'standalone',
      },
      injectRegister: 'auto',
      registerType: 'autoUpdate',
      workbox: command == 'build' ? {
        runtimeCaching: [
          {
            urlPattern: /(.*?)\.(js|css)/, // js /css /ts静态资源缓存
            handler: 'CacheFirst',
            options: {
              cacheName: 'script-cache',
            },
          }, {
            urlPattern: /(.*?)\.(html)/, // html缓存
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-cache',
              networkTimeoutSeconds: 5000
            },
          }, {
            urlPattern: /(.*?)\.(png|jpg|jpeg|webp|ico)/, // 静态资源缓存
            handler: 'CacheFirst',
            options: {
              cacheName: 'assets-cache'
            },
          }, {
            urlPattern: /(\/comic\/.+pages\?page=\d{1,}$)/g, // 接口缓存
            handler: 'CacheFirst',
            options: {
              cacheName: 'api-cache'
            },
          }
        ],
      } : {},
      devOptions: {
        enabled: true,
        type: 'module'
      },

    }),
    legacyPlugin({
      targets: ['defaults', 'ie >= 11', 'chrome 52'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
      renderLegacyChunks: true,
      renderModernChunks: false,
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    }
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss(tailwindConfig),
        postCssPxToRem({
          rootValue: 16,
          propList: ["*"],
        }),
        autoprefixer({
          overrideBrowserslist: [
            "Android 4.1",
            "iOS 7.1",
            "Chrome > 31",
            "ff > 31",
            "ie >= 8",
          ]
        }),
      ],
    },
  },
  build: {
    terserOptions: {
      compress: {
        drop_debugger: true,
        drop_console: true
      },
    }
  },
  base: "/"
}))