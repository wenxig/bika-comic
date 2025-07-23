import { isObject, isString, forEach, map } from 'lodash-es'

const IS_DEV = true //# use dev flag


export const api = async (data: Record<string, any>) => {
  data = {
    ...data,
    user: 'bikasvr',
    secret: '59c44c2f'
  }
  const body = new FormData()
  for (const key in data) body.set(key, isString(data[key]) ? data[key] : JSON.stringify(data[key]))
  const headers = new Headers()
  forEach({
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Accept-Language': 'zh-CN,zh;q=0.9',
    'Cache-Control': 'max-age=0',
    'Host': 'localhost:8787',
    'Sec-Ch-Ua': '"Chromium";v="1", "Not(A:Brand";v="1", "Google Chrome";v="1", "Genshin";v="4.6"',
    'Sec-Ch-Ua-Mobile': '?0', 'Sec-Ch-Ua-Platform': '"macOS"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'User-Agent': 'Mozilla/5.0 (Macintosh; IBM 1_0_0) AppleWebKit/1.0 (KHTML, like Gecko) Chrome/1.0.0.0 Safari/1.0'
  }, (v, k) => headers.set(k, v))
  try {
    const v = await (await fetch(`${'https://tinywebdb.appinventor.space'}/api?dev_message_action=${data.action}&dev_message_tag=${data.tag}`, {
      method: 'POST',
      headers,
      body,
      redirect: "follow",
    })).json() as any
    console.log('api:', data, v)

    return v
  } catch (error) {
    console.error('err:', error)
    throw error
  }
}
export const count = async (): Promise<number> => ((await api({
  action: "count"
})).count)
export async function get(key: string | number): Promise<any> {
  const raw = await api({
    tag: key.toString(),
    action: 'get'
  })
  const data = JSON.parse(raw[key])
  if (data == 'null' || data == null) return null
  if (isObject(data)) return (<any>data).value
  try {
    return JSON.parse(data).value
  } catch {
    return data.value
  }
}
export async function search(tag: string | number, type: "tag", no?: number, count?: number): Promise<string[]>
export async function search(tag: string | number, type: "value", no?: number, count?: number): Promise<any[]>
export async function search(tag: string | number, type: "both", no?: number, count?: number): Promise<{ tag: string, value: any }[]>
export async function search(tag: string | number, type: "value" | "tag" | "both" = "both", no = 1, count = 100,): Promise<string[] | any[] | { tag: string, value: any }[]> {
  const result = await api({
    tag,
    action: 'search',
    no,
    count,
    type
  })
  const allKeys = Object.keys(result) ?? []
  if (allKeys.length > 1) return allKeys.map((tag) => ({
    value: (() => isString(result[tag]) ? JSON.parse(result[tag]) : result[tag])(),
    tag
  }))
  return result[allKeys[0]] = (<any[]>result[allKeys[0]] ?? []).map((value) => {
    try {
      return isString(value) ? JSON.parse(value) : value
    } catch {
      return value
    }
  })
}
export const remove = (tag: string | number) => api({
  action: "delete",
  tag
})

export const update = (tag: string, value: object) => api({
  action: 'update',
  tag,
  value: JSON.stringify({ value }),
})

export const isInPlusPlan = async (tag: string) => {
  console.log('isInPlusPlan:', await get(tag))
  return !!(await get(tag))
}
export const updateWithChunk = async (tag: string, values: any[], cover = false) => {
  if (cover) {
    const tags = await search(tag, 'tag')
    console.log("cover tags:", tags)
    await Promise.all(map(tags, remove))
  }
  await Promise.all(map(values, (value, index) => update(`${tag}|${index}`, value)))
}
export const getWithChunk = async (tag: string) => {
  const values = (await search(`${tag}|`, 'value')).map(v => v.value)
  console.log('getWithChunk', 'total:', values)

  return values
}

export const getPageWithChunk = async (tag: string, page: number | string) => {
  const values = await getWithChunk(`${tag}$${page}`)
  console.log('getPageWithChunk', 'data:', values)
  return values
}

export const updatePageWithChunk = async (tag: string, page: number | string, values: any[]) => {
  updateWithChunk(`${tag}$${page}`, values, true)
}
