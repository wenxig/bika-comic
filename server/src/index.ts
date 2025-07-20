import { Hono } from 'hono/tiny'
import { cors } from "hono/cors"
/* Cloudflare绑定 */
type Bindings = {}
/* Hono变量 */
type Variables = {}
type ContextEnv = { Bindings: Bindings; Variables: Variables }
const app = new Hono<ContextEnv>()

app.use("/*", cors())

export default app
