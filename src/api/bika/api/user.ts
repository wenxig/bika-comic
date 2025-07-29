import { useAppStore } from "@/stores"
import { createClassFromResponseStream, PromiseContent, Stream } from "@/utils/data"
import { UserProfile, type RawUserProfile } from "../user"
import { picapiRest, type RawStream, type SortType } from ".."
import { RawLessComic, LessComic } from "../comic"

const appStore = useAppStore()

export const editSlogan = PromiseContent.fromAsyncFunction((slogan: string, signal?: AbortSignal) => picapiRest.put('/users/profile', { slogan }, { allowEmpty: true, signal }))

export const getProfile = PromiseContent.fromAsyncFunction(async (uid: string = appStore.loginToken, signal?: AbortSignal) => {
  if (uid == appStore.loginToken) return new UserProfile((await picapiRest.get<{ user: RawUserProfile }>('/users/profile', { signal })).data.user)
  return new UserProfile((await picapiRest.get<{ user: RawUserProfile }>(`/users/${uid}/profile`, { signal })).data.user)
})

export const punch = PromiseContent.fromAsyncFunction((signal?: AbortSignal) => picapiRest.post('/users/punch-in', undefined, { allowEmpty: true, signal }))

export const editAvatar = PromiseContent.fromAsyncFunction((imageDataUrl: string, signal?: AbortSignal) => picapiRest.put('/users/avatar', {
  allowEmpty: true,
  avatar: imageDataUrl
}, { signal }))

export const getFavouriteComic = PromiseContent.fromAsyncFunction((page: number, sort: SortType, signal?: AbortSignal) => createClassFromResponseStream(picapiRest.get<{ comics: RawStream<RawLessComic> }>(`/users/favourite?s=${sort}&page=${page}`, { signal }), LessComic))

export const createFavouriteComicStream = (sort: SortType) =>
  Stream.apiPackager<LessComic>((page, signal) => getFavouriteComic(page, sort, signal))
