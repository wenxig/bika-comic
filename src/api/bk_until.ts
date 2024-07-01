import { HmacSHA256, enc } from "crypto-js";

const config = Object.freeze({
  AppChannel: "1",
  Accept: "application/vnd.picacomic.com.v1+json",
  Platform: "android",
  ImageQuality: "original",
  Uuid: "webUUID",
  BaseUrl: 'https://picaapi.picacomic.com/',
  appleKillFlag: 'C69BAF41DA5ABD1FFEDC6D2FEA56B',
  appleVerSion: '~d}$Q7$eIni=V)9\\RK/P.RM4;9[7|@/CA}b~OW!3?EV`:<>M7pddUBL5n|0/*Cn'
})
function getsignature(url: string, ts: string, method: string) {
  let raw = url.replace(config.BaseUrl, "") + ts + getNonce() + method + config.appleKillFlag;
  raw = raw.toLowerCase();
  return HmacSHA256(raw, config.appleVerSion).toString(enc.Hex);
}
export function postHeader(setTime: string, pathname: string, mothod: string) {
  const mySignature = getsignature(config.BaseUrl + pathname, setTime, mothod);
  const header = [
    { 'name': 'app-channel', 'value': '1' },
    { 'name': 'app-uuid', 'value': 'webUUID' },
    { 'name': "accept", 'value': 'application/vnd.picacomic.com.v1+json' },
    { 'name': "app-platform", 'value': 'android' },
    { 'name': "Content-Type", 'value': 'application/json; charset=UTF-8' },
    { 'name': "time", 'value': setTime },
    { 'name': "nonce", 'value': getNonce() },
    { 'name': "image-quality", 'value': config.ImageQuality },
    { 'name': 'signature', 'value': mySignature }
  ]
  const getToken = localStorage.getItem('token');
  if (getToken != undefined) header.push({ 'name': 'authorization', 'value': getToken });
  return header;
}
function getNonce() {
  let useronce = localStorage.getItem('nonce');
  if (useronce == undefined) {
    useronce = randomString(32).toLowerCase();
    localStorage.setItem('nonce', useronce ?? '')
  }
  return useronce;
}
function randomString(e: number) {
  e = e || 32;
  const t = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678",
    a = t.length
  let n = "";
  for (let i = 0; i < e; i++) n += t.charAt(Math.floor(Math.random() * a));
  return n
}