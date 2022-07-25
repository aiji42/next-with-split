import { NextResponse, userAgent } from 'next/server'
import type { NextRequest } from 'next/server'
import type { CookieSerializeOptions } from 'cookie'
import type { RuntimeConfig } from './types'
import type { NextMiddlewareResult } from 'next/dist/server/web/types'
import { random } from './random'

type Config = RuntimeConfig[string]

export const middleware = (req: NextRequest): NextMiddlewareResult => {
  const [splitKey, config] = getCurrentSplitConfig(req) ?? []
  if (!splitKey || !config || userAgent(req).isBot) return
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
  if (req.cookies.has('__prerender_bypass')) return
  if (!process.env.NEXT_WITH_SPLIT_RUNTIME_CONFIG) return

  return Object.entries(
    JSON.parse(process.env.NEXT_WITH_SPLIT_RUNTIME_CONFIG) as RuntimeConfig
  ).find(([, { path }]) => new RegExp(path).test(req.nextUrl.href))
}

const getBranch = (req: NextRequest, splitKey: string, config: Config) => {
  const cookieBranch = req.cookies.get(cookieKey(splitKey))
  if (cookieBranch && config.hosts[cookieBranch]) return cookieBranch

  const branches = Object.entries(config.hosts).reduce<string[]>(
    (res, [key, { weight }]) => [...res, ...new Array(weight).fill(key)],
    []
  )
  return branches[random(branches.length)]
}

const sticky = (
  res: NextResponse,
  splitKey: string,
  branch: string,
  cookieConfig: CookieSerializeOptions
): NextResponse => {
  res.cookies.set(cookieKey(splitKey), branch, cookieConfig)
  return res
}

const createResponse = (
  req: NextRequest,
  branch: string,
  config: Config
): NextResponse => {
  const rewriteTo = `${
    config.hosts[branch].isOriginal ? '' : config.hosts[branch].host
  }${req.nextUrl.href.replace(req.nextUrl.origin, '')}`
  const isExternal = rewriteTo.startsWith('http')

  if (isExternal) return NextResponse.rewrite(rewriteTo)

  return NextResponse.next()
}
