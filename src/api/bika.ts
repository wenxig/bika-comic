import { useConfig } from "@/config"
import { useAppStore } from "@/stores"
import { delay } from "@/utils/delay"
import eventBus from "@/utils/eventBus"
import { requestErrorHandleInterceptors as requestErrorInterceptors, requestErrorResult, requestType } from "@/utils/request"
import { until, useOnline } from "@vueuse/core"
import axios, { isAxiosError, isCancel, type AxiosResponse } from "axios"
import { enc, HmacSHA256 } from "crypto-js"
import { isEmpty, values } from "lodash-es"
import allProxy from './bika_proxy.json'
export namespace bika {
  export type ImageQuality = 'low' | 'medium' | 'high' | 'original'
  export type SortType = 'dd' | 'da' | 'ld' | 'vd'
  export type SearchMode = "id" | "pid" | "uploader" | "translator" | "author" | "keyword" | 'categories' | 'tag'
  export interface FillerTag {
    name: string
    mode: "hidden" | "show" | "auto"
  }
  export type RawResponse<T = object> = {
    message: string,
    code: 200,
    data?: T,
    error?: undefined
  } | {
    message: string,
    code: number,
    data: undefined,
    error: string
  }
  const config = useConfig()
  const appStore = useAppStore()
  eventBus.on('networkError_unauth', () => {
    appStore.loginToken = ''
  })
  const getBikaApiHeaders = (pathname: string, method: string) => {
    type Headers = [name: string, value: string][]
    pathname = pathname.substring(1)
    const requestTime = (new Date().getTime() / 1000).toFixed(0)
    const appStore = useAppStore()
    const rawSignature = `${pathname}${requestTime}${appStore.nonce}${method}C69BAF41DA5ABD1FFEDC6D2FEA56B`.toLowerCase()
    const headers: Headers = [
      ['app-channel', '1'],
      ['app-uuid', 'webUUID'],
      ['accept', 'application/vnd.picacomic.com.v1+json'],
      ['app-platform', 'android'],
      ['Content-Type', 'application/json; charset=UTF-8'],
      ['time', requestTime],
      ['nonce', appStore.nonce],
      ['image-quality', config["bika.read.imageQuality"]],
      ['signature', HmacSHA256(rawSignature, '~d}$Q7$eIni=V)9\\RK/P.RM4;9[7|@/CA}b~OW!3?EV`:<>M7pddUBL5n|0/*Cn').toString(enc.Hex)],
      ['raw-signature', rawSignature]
    ]
    if (!isEmpty(appStore.loginToken)) headers.push(['authorization', appStore.loginToken])
    return headers
  }
  export const api = axios.create({
    baseURL: '',
    adapter: ["fetch", "xhr", "http"],
    timeout: 5000
  })
  api.interceptors.request.use(async requestConfig => {
    if (values(requestConfig.data).includes(undefined)) return requestErrorResult('networkError_request', 'some values is undefined')
    const baseInterface = allProxy.interface.find(v => config["bika.proxy.interfaceId"] == v.id)
    if (!baseInterface) return requestErrorResult('networkError_request', `Interface is empty (id=${config["bika.proxy.interfaceId"]})`)
    requestConfig.baseURL = `https://${baseInterface.basePart}.${baseInterface.url}`
    await until(useOnline()).toBe(true)
    for (const value of getBikaApiHeaders(requestConfig.url ?? '/', requestConfig.method!.toUpperCase())) requestConfig.headers.set(...value)
    return requestConfig
  })
  api.interceptors.response.use(async (v: AxiosResponse<RawResponse>) => {
    if (v.data.error || v.data.data) return v
    await delay(3000)
    if (["/", ''].includes(v.config.url ?? '')) return v
    if (requestType.isPost(v) || requestType.isPut(v)) return v
    return requestErrorResult('networkError_emptyData', v.data)
  })
  api.interceptors.response.use(undefined, async err => {
    if (isCancel(err) || !isAxiosError<RawResponse>(err)) return Promise.reject(err)
    await delay(3000)
  })
  api.interceptors.response.use(undefined, requestErrorInterceptors.createCheckIsUnauth(api, async () => {
    
  }))
  api.interceptors.response.use(undefined, requestErrorInterceptors.isClientError)
  api.interceptors.response.use(undefined, requestErrorInterceptors.createAutoRetry(api, 4))
}