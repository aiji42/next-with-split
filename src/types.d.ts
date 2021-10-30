import { CookieSerializeOptions } from 'cookie'

export type SplitOptions = {
  [keyName: string]: {
    path: string
    hosts: {
      [branchName: string]: string | { host: string; weight: number }
    }
    cookie?: CookieSerializeOptions
  }
}

export type RuntimeConfig = {
  [keyName: string]: {
    path: string
    hosts: {
      [branchName: string]: {
        host: string
        weight: number
        isOriginal: boolean
      }
    }
    cookie: CookieSerializeOptions
  }
}
