import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { toPairs } from 'lodash-es'

export const runtime = 'edge'

const app = new Hono().basePath('/api')

const baseUrl = "https://live-server.bidobido.xyz"

app.all('/chat/*', async c => {
  try {
    console.log('chat method:', c.req.method)
    const searchStringTuble = toPairs(c.req.query())
    const searchString = searchStringTuble.map(v => v.join('=')).join('&')
    const requestion = await fetch(`${baseUrl}${c.req.path.replaceAll('/chat', '')}?${searchString}`, {
      method: c.req.method,
      headers: {
        ...c.req.header(),
        "user-agent": "Dart/2.19 (dart:io)",
        "accept-encoding": "gzip",
        "api-version": "1.0.3",
        "content-type": "application/json; charset=UTF-8"
      },
      body: c.req.method == 'GET' || c.req.method == 'HEAD' ? undefined : await c.req.text(),
    })
    return c.body(requestion.body, { status: requestion.status, headers: requestion.headers })
  } catch (error) {
    console.error(error)
    return c.text('err', 500)
  }
})

export const GET = handle(app)
export const POST = handle(app)