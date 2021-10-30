import { NextRequest, NextResponse } from 'next/server'
import { CookieSerializeOptions } from 'cookie'


export const middleware = (req: NextRequest) => {
  const [splitKey, config] = getCurrentSplitConfig(req) ?? []
  if (!splitKey || !config) return

  const branch = getBranch(req, splitKey, config)
  const res = NextResponse.rewrite((branch === 'original' ? '' : config.hosts[branch].host) + req.nextUrl.href)
  return sticky(res, splitKey, branch, config.cookie)
}

const cookieKey = (key: string) => `x-split-key-${key}`

export type Distribution = {
  host: string
  cookie: CookieSerializeOptions
  isOriginal: boolean
  weight: number
}

type OriginalSplitConfig = {
  [key: string]: {
    path: string;
    hosts: {
      [branch: string]: { host: string; weight: number }
    }
    cookie: CookieSerializeOptions
  }
}

const getCurrentSplitConfig = (req: NextRequest) => {
  if (req.cookies['__prerender_bypass']) return


  return Object.entries(process.env.splits as unknown as OriginalSplitConfig)
    .find(([, { path }]) => new RegExp(path).test(req.nextUrl.href))
}

const getBranch = (req: NextRequest, splitKey: string, config: OriginalSplitConfig[string]) => {
  const cookieBranch = req.cookies[cookieKey(splitKey)]
  if (cookieBranch && config.hosts[cookieBranch])
    return cookieBranch

  const branches = Object.entries(config.hosts).reduce<string[]>(
    (res, [key, { weight }]) => [...res, ...new Array(weight).fill(key)],
    []
  )
  return branches[Math.floor(Math.random() * branches.length)]
}

const sticky = (
  res: NextResponse,
  splitKey: string,
  branch: string,
  cookieConfig: CookieSerializeOptions
) => res.cookie(cookieKey(splitKey), branch, { ...cookieConfig, maxAge: cookieConfig.maxAge * 1000 })
