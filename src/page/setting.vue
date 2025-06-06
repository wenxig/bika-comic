<script setup lang='ts'>
import config from '@/config'
import { createLoadingMessage, createDialog } from '@/utils/message'
import { shallowReactive, shallowRef } from 'vue'
import allProxies from '@/api/proxy.json'
import { sorterValue } from '@/utils/translater'
import Sorter from '@/components/search/sorter.vue'
import { searchResult } from '@/stores/temp'
document.title = '设置 | bika'
import Popup from '@/components/popup.vue'
import { NScrollbar } from 'naive-ui'
import { version } from '../../package.json'
import { onBeforeRouteLeave } from 'vue-router'
import localforage from 'localforage'
import { clearComicPagesTemp } from '@/api'
import { uniq } from 'lodash-es'
const $window = window

document.body.classList.add('setting-page')
onBeforeRouteLeave(() => {
  document.body.classList.remove('setting-page')
})
defineProps<{
  hideNavbar?: boolean
}>()

const clearDb = () => (createDialog({
  title: '清除本地数据库',
  content: '这会清除你的历史记录，登陆等',
}).then(async () => {
  localStorage.clear()
  document.cookie = ''
  await Promise.all([
    ...(await caches.keys()).map(key => caches.delete(key)),
    localforage.clear(),
    clearComicPagesTemp()
  ])
  location.pathname = '/'
}))

const showSetPreloadImageNumbers = shallowRef(false)

const reloadServiceWorker = async () => {
  const loading = createLoadingMessage('重载中')
  if (import.meta.env.DEV) return loading.success()
  try {
    await (await navigator.serviceWorker.getRegistration('/sw.js'))?.unregister()
    await Promise.all((await caches.keys()).map(key => caches.delete(key)))
    await loading.success('成功！', 300)
    location.reload()
  } catch {
    loading.fail('失败！', 300)
  }
}

const sorter = shallowRef<InstanceType<typeof Sorter>>()

const showImageProxySelect = shallowRef(false)
const _ImageProxy = shallowReactive([config.value['bika.proxy.image']])

const showInterfaceProxySelect = shallowRef(false)
const _InterfaceProxy = shallowReactive([config.value['bika.proxy.interface']])

const showDbProxySelect = shallowRef(false)
const _DbProxy = shallowReactive([config.value['bika.proxy.db']])

const Url = URL

const quitLogin = () => {
  localStorage.clear()
  location.pathname = '/'
}
const showAddSelfImageProxy = shallowRef(false)
const selfImageProxyInputerText = shallowRef('')
const changeToSelfImageProxy = () => {
  const url = selfImageProxyInputerText.value.replace(/(?=.+)\/+$/ig, '')
  if (!URL.canParse(url)) return window.$message.error('不是合规的url地址')
  config.value['bika.proxy.image'] = _ImageProxy[0] = url
  showAddSelfImageProxy.value = showImageProxySelect.value = false
  selfImageProxyInputerText.value = ''
}
</script>

<template>
  <VanNavBar title="设置" left-arrow @click-left="$router.back()" v-if="!hideNavbar" />
  <NScrollbar class="w-full h-[calc(100%-46px)]" :class="[hideNavbar && '!h-full']">
    <VanCellGroup title="系统设置">
      <van-cell center title="深色模式">
        <template #right-icon>
          <van-switch v-model="config['bika.darkMode']" />
        </template>
      </van-cell>
      <van-cell title="重载serviceWorker" clickable @click="reloadServiceWorker"
        v-if="('serviceWorker' in $window.navigator)" />
      <VanCell clickable @click="clearDb" title="清除本地数据库">
        <van-icon name="warning-o" size="21px" />
      </VanCell>
      <VanCell clickable @click="quitLogin" title="退出登陆">
        <van-icon name="warning-o" size="21px" />
      </VanCell>
      <van-cell center title="开发者模式">
        <template #right-icon>
          <van-switch v-model="config['bika.devMode']" />
        </template>
      </van-cell>
    </VanCellGroup>
    <VanCellGroup title="搜索设置">
      <van-cell center title="展示AI作品">
        <span class="mr-1">不一定完全过滤</span>
        <template #right-icon>
          <van-switch v-model="config['bika.search.showAIProject']" />
        </template>
      </van-cell>
      <van-cell title="搜索排序" clickable
        @click="sorter?.show()">{{ sorterValue.find(v => v.value == config['bika.search.sort'])?.text }}</van-cell>
    </VanCellGroup>
    <VanCellGroup title="观看设置">
      <van-cell center title="漫画选择反向排序">
        <template #right-icon>
          <van-switch v-model="config['bika.info.unsortComic']" />
        </template>
      </van-cell>
      <van-cell center title="阅读时全屏">
        <template #right-icon>
          <van-switch v-model="config['bika.read.watchFullscreen']" />
        </template>
      </van-cell>
      <van-cell center title="垂直阅读">
        <template #right-icon>
          <van-switch v-model="config['bika.read.vertical']" />
        </template>
      </van-cell>
      <van-cell center title="单页显示两张">
        <template #right-icon>
          <van-switch v-model="config['bika.read.twoImage']" />
        </template>
      </van-cell>
      <van-cell center title="反向阅读">
        <template #right-icon>
          <van-switch v-model="config['bika.read.rtl']" disabled />
        </template>
      </van-cell>
      <VanCell clickable @click.stop="showSetPreloadImageNumbers = true" title="图片预加载数量">
        {{ config['bika.read.preloadIamgeNumbers'] }}
      </VanCell>
    </VanCellGroup>
    <VanCellGroup title="小窗播放">
      <van-cell center title="启用">
        <template #right-icon>
          <van-switch v-model="config['bika.smallWindow.enable']" />
        </template>
      </van-cell>
      <van-cell center title="退出自动切换小窗">
        <template #right-icon>
          <van-switch v-model="config['bika.smallWindow.openOnQuit']" />
        </template>
      </van-cell>
    </VanCellGroup>
    <VanCellGroup title="分流设置">
      <van-cell title="接口分流" clickable
        @click="showInterfaceProxySelect = true">{{ config['bika.proxy.interface'] }}</van-cell>
      <van-cell title="图片分流" clickable
        @click="showImageProxySelect = true">{{ new Url(config['bika.proxy.image']).host }}</van-cell>
      <van-cell title="订阅分流" clickable
        @click="showDbProxySelect = true">{{ new Url(config['bika.proxy.db']).host }}</van-cell>
    </VanCellGroup>
    <VanCellGroup title="关于">
      <VanCell title="版本">{{ version }}</VanCell>
    </VanCellGroup>
  </NScrollbar>

  <Popup v-model:show="showImageProxySelect" round position="bottom">
    <van-picker class="van-hairline--bottom"
      :columns="uniq(allProxies.image.concat([config['bika.proxy.image']])).map(v => ({ text: v, value: v }))"
      @cancel="showImageProxySelect = false"
      @confirm="(v) => { config['bika.proxy.image'] = v.selectedValues[0]; showImageProxySelect = false }"
      v-model="_ImageProxy" />
    <VanCell clickable @click="showAddSelfImageProxy = true" border title="自定义"></VanCell>
  </Popup>
  <Popup v-model:show="showInterfaceProxySelect" round position="bottom">
    <van-picker :columns="allProxies.interface.map(v => ({ text: v.basePart, value: v.basePart }))"
      @cancel="showInterfaceProxySelect = false"
      @confirm="(v) => { config['bika.proxy.interface'] = v.selectedValues[0]; showInterfaceProxySelect = false }"
      v-model="_InterfaceProxy" />
  </Popup>
  <Popup v-model:show="showDbProxySelect" round position="bottom">
    <van-picker :columns="allProxies.db.map(v => ({ text: v, value: v }))"
      @cancel="showDbProxySelect = false"
      @confirm="(v) => { config['bika.proxy.db'] = v.selectedValues[0]; showDbProxySelect = false }"
      v-model="_DbProxy" />
  </Popup>

  <Popup v-model:show="showAddSelfImageProxy" round position="bottom">
    <VanField v-model="selfImageProxyInputerText" class="mt-2" placeholder="输入你的url地址, 如: https://github.com/wenxig" />
    <VanButton block class="w-full h-8 mt-20" type="primary" @click="changeToSelfImageProxy">提交</VanButton>
  </Popup>
  <Sorter ref="sorter" @reload="searchResult.clear()" />
  <VanNumberKeyboard :model-value="config['bika.read.preloadIamgeNumbers'].toString()"
    @update:model-value="value => config['bika.read.preloadIamgeNumbers'] = Number(value)"
    :show="showSetPreloadImageNumbers" @blur="showSetPreloadImageNumbers = false" />
</template>
<style scoped lang='scss'>
:global(*) {
  --van-border-width: 1px;
}
</style>