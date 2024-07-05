import config from "@/config"
import { HmacSHA256, enc } from "crypto-js"

export function getBikaApiHeaders(pathname: string, method: string) {
  type Headers = [name: string, value: string][]
  pathname = pathname.substring(1)
  const requestTime = (new Date().getTime() / 1000).toFixed(0)
  let nonce = localStorage.getItem('nonce')
  if (!nonce) {
    const chars = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678"
    nonce = Array.from({ length: 32 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('').toLowerCase()
    localStorage.setItem('nonce', nonce)
  }
  const headers: Headers = [
    ['app-channel', '1'],
    ['app-uuid', 'webUUID'],
    ['accept', 'application/vnd.picacomic.com.v1+json'],
    ['app-platform', 'android'],
    ['Content-Type', 'application/json; charset=UTF-8'],
    ['time', requestTime],
    ['nonce', nonce],
    ['image-quality', config.value["bika.read.imageQuality"]],
    ['signature', HmacSHA256(`${pathname}${requestTime}${nonce}${method}C69BAF41DA5ABD1FFEDC6D2FEA56B`.toLowerCase(), '~d}$Q7$eIni=V)9\\RK/P.RM4;9[7|@/CA}b~OW!3?EV`:<>M7pddUBL5n|0/*Cn').toString(enc.Hex)]
  ]
  const token = localStorage.getItem('token')
  if (token) headers.push(['authorization', token])
  return headers
}