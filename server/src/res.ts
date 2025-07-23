import type { Context } from "hono"
import type { z, TypeOf } from "zod"

export namespace ResponseType {
  export enum Code {
    success,
    fail
  }
  export enum FailCode {
    notFound,
    falseMethod,
    unauthorization,
    format,
    server
  }
  export interface Success {
    code: Code.success
    data: any
  }
  export interface Fail {
    code: Code.fail
    data: {
      message: any,
      code: FailCode
    }
  }
}
export const isType = <T extends z.ZodType>(val: unknown, type: T): val is TypeOf<T> => {
  const res = type.safeParse(val)
  if (!res.success) console.error(JSON.stringify(res.error))
  return res.success
}
export const createError = (c: Context, message: any, code: ResponseType.FailCode, netCode: number) => {
  const v = {
    code: ResponseType.Code.fail,
    data: {
      code,
      message
    }
  }
  console.error(v)
  return c.json(v as ResponseType.Fail, netCode as any)
}
export const createSuccess = (c: Context, data?: any, netCode = 200) => c.json({
  code: ResponseType.Code.success,
  data
} as ResponseType.Success, netCode as any)

export namespace util {
  export const notFound = (c: Context) => createError(c, "not found", ResponseType.FailCode.notFound, 404)
  export const typeError = (c: Context) => createError(c, "data type error", ResponseType.FailCode.falseMethod, 400)
}