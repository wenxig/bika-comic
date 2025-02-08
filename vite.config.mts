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

enum BuildFlag {
  production,
  preview
}

const BUILD_FALG = BuildFlag.production as BuildFlag

export default defineConfig({
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
      includeAssets: [],
      manifest: {
        name: _package.name,
        start_url: './',
        short_name: _package.name,
        icons: [{
          src: 'favicon.webp',
          sizes: "512x512",
          type: "image/webp",
          purpose: "any",
        }],
        theme_color: '#000000',
        display: 'standalone',
        lang: 'zh-cn'
      },
      injectRegister: 'inline',
      registerType: 'autoUpdate',
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /\.(js|css)/ig, // js /css /ts静态资源缓存
            handler: 'CacheFirst',
            options: {
              cacheName: 'script-cache',
            },
          }, {
            urlPattern: /\.(html)/ig, // html缓存
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-cache',
              networkTimeoutSeconds: 5000
            },
          }, {
            urlPattern: /\.(webp|jpg|jpeg|png|ico)/ig, // 静态资源缓存
            handler: 'CacheFirst',
            options: {
              cacheName: 'assets-cache'
            },
          }
        ],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        maximumFileSizeToCacheInBytes: 1024 * 1024 * 1024
      },
      injectManifest: {
        maximumFileSizeToCacheInBytes: 1024 * 1024 * 1024
      },
      devOptions: {
        enabled: true,
        type: 'module',
        suppressWarnings: true,
      },
    }),
    BUILD_FALG == BuildFlag.production && legacyPlugin({
      targets: ['defaults', 'ie >= 11', 'chrome 52'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
      renderLegacyChunks: true,
      renderModernChunks: false,
    }),
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
      ] as any,
    },
  },
  build: {
    terserOptions: {
      compress: {
        drop_debugger: true,
        // drop_console: true
      },
    },
    target: BUILD_FALG == BuildFlag.preview ? ['ESNext'] : undefined
  },
  define: {
    __VAN_CELL_HEIGHT__: 44
  },
  base: "/"
})