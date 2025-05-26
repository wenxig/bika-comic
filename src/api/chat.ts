import { setValue } from "@/utils/requset"
import type { CommenUser, Image, UserSex } from "."

interface RawChatUserProfile {
  totalBlocked: number
  id: string
  email: '***'
  name: string
  birthday: string
  gender: UserSex
  slogan: string
  title: string
  level: number
  exp: number
  role: string
  characters: string[]
  created_at: string
  avatarUrl: string
}
export class ChatUserProfile implements RawChatUserProfile, CommenUser {
  public totalBlocked!: number
  public id!: string
  public readonly email = '***'
  public name!: string
  public birthday!: string
  public gender!: UserSex
  public slogan!: string
  public title!: string
  public level!: number
  public exp!: number
  public role!: string
  public characters!: string[]
  public created_at!: string
  public get _id() {
    return this.id
  }
  public get created_time() {
    return new Date(this.created_at)
  }
  public avatarUrl!: string
  constructor(p: RawChatUserProfile) {
    setValue(this, p)
  }
  public verified = true
  public get avatar(): Image {
    throw new Error("Method can not implemented.")
  }
  public set avatar(_v: Image) {
    throw new Error("Method can not implemented.")
  }
}