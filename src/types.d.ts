import { Rewrite } from 'next/dist/lib/load-custom-routes'
import { CookieSerializeOptions } from 'cookie'

export type Rewrites =
  | {
      beforeFiles?: Rewrite[]
      afterFiles?: Rewrite[]
      fallback?: Rewrite[]
    }
  | Rewrite[]

export type SplitOptions = {
  [keyName: string]: {
    path: string
    hosts: {
      [branchName: string]: string
    }
    cookie?: CookieSerializeOptions
  }
}

export type SplitConfig = { branch: string } & Distribution

export type Distribution = {
  host: string
  path: string
  cookie: CookieSerializeOptions
}

export type RuntimeConfig = {
  [keyName: string]: {
    [branch: string]: Distribution
  }
}
