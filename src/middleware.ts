import { NextRequest, NextResponse } from 'next/server'
import { CookieSerializeOptions } from 'cookie'
import { RuntimeConfig } from './types'
import { NextMiddlewareResult } from 'next/dist/server/web/types'

type Config = RuntimeConfig[string]

export const middleware = (req: NextRequest): NextMiddlewareResult => {
  const [splitKey, config] = getCurrentSplitConfig(req) ?? []
  if (!splitKey || !config || req.ua?.isBot) return
  const branch = getBranch(req, splitKey, config)

  return sticky(
    createResponse(req, branch, config),
    splitKey,
    branch,
    config.cookie
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

const createResponse = (
  req: NextRequest,
  branch: string,
  config: Config
): NextResponse => {
  const rewriteTo = `${
    config.hosts[branch].isOriginal ? '' : config.hosts[branch].host
  }${req.nextUrl.href.replace(req.nextUrl.origin, '')}`
  const isExternal = rewriteTo.startsWith('http')
  const isOutOfTarget = !new RegExp(config.path).test(getRefererPathname(req))

  if (req.preflight && isExternal && isOutOfTarget)
    return new NextResponse(null)
  return NextResponse.rewrite(rewriteTo)
}

const getRefererPathname = (req: NextRequest) => {
  let pathname = ''
  try {
    pathname = new URL(req.headers.get('referer') ?? '').pathname
  } catch (_) {
    return pathname
  }
  return pathname
}
