import { NextRequest, NextResponse } from 'next/server'
import { CookieSerializeOptions } from 'cookie'
import { RuntimeConfig } from './types'
import { NextMiddlewareResult } from 'next/dist/server/web/types'

export const middleware = (req: NextRequest): NextMiddlewareResult => {
  const [splitKey, config] = getCurrentSplitConfig(req) ?? []
  if (
    !splitKey ||
    !config ||
    req.ua?.isBot ||
    req.headers.has('x-middleware-rewrite')
  )
    return

  const branch = getBranch(req, splitKey, config)
  const res = NextResponse.rewrite(
    (config.hosts[branch].isOriginal ? '' : config.hosts[branch].host) +
      req.nextUrl.href.replace(req.nextUrl.origin, '')
  )

  if (
    req.preflight &&
    res.headers.get('x-middleware-rewrite')?.startsWith('http')
  )
    return new NextResponse(null)

  return sticky(res, splitKey, branch, config.cookie)
}

const cookieKey = (key: string) => `x-split-key-${key}`

const getCurrentSplitConfig = (req: NextRequest) => {
  if (req.cookies['__prerender_bypass']) return
  if (!process.env.NEXT_WITH_SPLIT_RUNTIME_CONFIG) return

  return Object.entries(
    JSON.parse(process.env.NEXT_WITH_SPLIT_RUNTIME_CONFIG) as RuntimeConfig
  ).find(([, { path }]) => new RegExp(path).test(req.nextUrl.href))
}

const getBranch = (
  req: NextRequest,
  splitKey: string,
  config: RuntimeConfig[string]
) => {
  const cookieBranch = req.cookies[cookieKey(splitKey)]
  if (cookieBranch && config.hosts[cookieBranch]) return cookieBranch

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
) => res.cookie(cookieKey(splitKey), branch, cookieConfig)
