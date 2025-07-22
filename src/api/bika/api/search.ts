import { PromiseContent } from "@/utils/data"
import { picapiRest } from ".."
export const getHotTags = PromiseContent.fromAsyncFunction(async (signal?: AbortSignal) => (await picapiRest.get<{ keywords: string[] }>("/keywords", { signal })).data.keywords)
