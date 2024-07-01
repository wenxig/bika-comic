<script setup lang='ts'>
import config from '@/config'
import { createLoadingMessage } from '@/utils/message'
import { showConfirmDialog } from 'vant'
import { shallowReactive, shallowRef } from 'vue'
import allProxies from '@/api/proxy.json'
import { sorterValue } from '@/utils/translater'
import Sorter from '@/components/search/sorter.vue'
import { searchResult } from '@/stores/temp'
document.title = '设置 | bika'
import Popup from '@/components/popup.vue'
const $window = window

const clearDb = () => showConfirmDialog({
  title: '清除本地数据库',
  message: '这会清除你的历史记录，登陆等',
}).then(async () => {
  localStorage.clear()
  document.cookie = ''
  await Promise.all((await caches.keys()).map(key => caches.delete(key)))
  location.reload()
})

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
const _ImageProxy = shallowReactive([config.value.proxy.image])

const showInterfaceProxySelect = shallowRef(false)
const _InterfaceProxy = shallowReactive([config.value.proxy.interface])

const showDbProxySelect = shallowRef(false)
const _DbProxy = shallowReactive([config.value.proxy.db])

const Url = URL

const quitLogin = () => {
  localStorage.clear()
  location.reload()
}
</script>

<template>
  <VanNavBar title="设置" />
  <VanCellGroup title="系统设置">
    <van-cell center title="全屏">
      <template #right-icon>
        <van-switch v-model="config.value.fullscreen" disabled />
      </template>
    </van-cell>
    <van-cell center title="深色模式">
      <template #right-icon>
        <van-switch v-model="config.value.darkMode" />
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
        <van-switch v-model="config.value.devMode" />
      </template>
    </van-cell>
  </VanCellGroup>
  <VanCellGroup title="搜索设置">
    <van-cell center title="展示AI作品">
      <span class="mr-1">不一定完全过滤</span>
      <template #right-icon>
        <van-switch v-model="config.value.showAIProject" />
      </template>
    </van-cell>
    <van-cell title="搜索排序" clickable
      @click="sorter?.show()">{{ sorterValue.find(v => v.value == config.value.searchSort)?.text }}</van-cell>
  </VanCellGroup>
  <VanCellGroup title="观看设置">
    <van-cell center title="漫画选择反向排序">
      <template #right-icon>
        <van-switch v-model="config.value.unsortComic" />
      </template>
    </van-cell>
    <van-cell center title="阅读时全屏">
      <template #right-icon>
        <van-switch v-model="config.value.watchFullscreen" />
      </template>
    </van-cell>
    <VanCell clickable @click.stop="showSetPreloadImageNumbers = true" title="图片预加载数量">
      {{ config.value.preloadIamgeNumbers }}
    </VanCell>
  </VanCellGroup>
  <VanCellGroup title="分流设置">
    <van-cell title="接口分流" clickable
      @click="showInterfaceProxySelect = true">{{ new Url(config.value.proxy.interface).host }}</van-cell>
    <van-cell title="图片分流" clickable
      @click="showImageProxySelect = true">{{ new Url(config.value.proxy.image).host }}</van-cell>
    <van-cell title="订阅分流" clickable
      @click="showDbProxySelect = true">{{ new Url(config.value.proxy.db).host }}</van-cell>
  </VanCellGroup>

  <Popup v-model:show="showImageProxySelect" round position="bottom">
    <van-picker :columns="allProxies.image.map(v => ({ text: new Url(v).host, value: v }))"
      @cancel="showImageProxySelect = false"
      @confirm="(v) => { config.value.proxy.image = v.selectedValues[0]; showImageProxySelect = false }"
      v-model="_ImageProxy" />
  </Popup>
  <Popup v-model:show="showInterfaceProxySelect" round position="bottom">
    <van-picker :columns="allProxies.interface.map(v => ({ text: new Url(v).host, value: v }))"
      @cancel="showInterfaceProxySelect = false"
      @confirm="(v) => { config.value.proxy.interface = v.selectedValues[0]; showInterfaceProxySelect = false }"
      v-model="_InterfaceProxy" />
  </Popup>
  <Popup v-model:show="showDbProxySelect" round position="bottom">
    <van-picker :columns="allProxies.db.map(v => ({ text: new Url(v).host, value: v }))"
      @cancel="showDbProxySelect = false"
      @confirm="(v) => { config.value.proxy.db = v.selectedValues[0]; showDbProxySelect = false }" v-model="_DbProxy" />
  </Popup>
  <Sorter ref="sorter" @reload="searchResult.clear()" />
  <VanNumberKeyboard :model-value="config.value.preloadIamgeNumbers.toString()"
    @update:model-value="value => config.value.preloadIamgeNumbers = Number(value)" :show="showSetPreloadImageNumbers"
    @blur="showSetPreloadImageNumbers = false" />
</template>