import { NextRequest, NextResponse } from 'next/server'
import { CookieSerializeOptions } from 'cookie'
import { RuntimeConfig } from './types'
import { NextMiddlewareResult } from 'next/dist/server/web/types'

type Config = RuntimeConfig[string]

export const middleware = (req: NextRequest): NextMiddlewareResult => {
  const [splitKey, config] = getCurrentSplitConfig(req) ?? []
  if (!splitKey || !config || req.ua?.isBot) return

  const branch = getBranch(req, splitKey, config)
  const res = NextResponse.rewrite(
    (config.hosts[branch].isOriginal ? '' : config.hosts[branch].host) +
      req.nextUrl.href.replace(req.nextUrl.origin, '')
  )

  return (
    handlePreflight(req, res, config) ??
    sticky(res, splitKey, branch, config.cookie)
  )
}

const cookieKey = (key: string) => `x-split-key-${key}`

const getCurrentSplitConfig = (req: NextRequest) => {
  if (req.cookies['__prerender_bypass']) return
  if (!process.env.NEXT_WITH_SPLIT_RUNTIME_CONFIG) return

  return Object.entries(
    JSON.parse(process.env.NEXT_WITH_SPLIT_RUNTIME_CONFIG) as RuntimeConfig
  ).find(([, { path }]) => new RegExp(path).test(req.nextUrl.href))
}

const getBranch = (req: NextRequest, splitKey: string, config: Config) => {
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

const handlePreflight = (
  req: NextRequest,
  res: NextResponse,
  config: Config
): undefined | NextResponse => {
  if (!req.preflight) return
  const isExternal = res.headers.get('x-middleware-rewrite')?.startsWith('http')
  try {
    const isFromTarget = new RegExp(config.path).test(
      new URL(req.headers.get('referer') ?? '').pathname
    )
    if (!isFromTarget && isExternal) return new NextResponse(null)
  } catch (_) {
    return
  }
}
