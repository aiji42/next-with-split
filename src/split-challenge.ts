import { GetServerSideProps, GetServerSidePropsContext } from 'next'
import { setCookie, parseCookies } from 'nookies'
import { ParsedUrlQuery } from 'querystring'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as pathToRegexp from 'next/dist/compiled/path-to-regexp'
import getConfig from 'next/config'
import { Distribution, SplitConfig } from './types'
import { reverseProxy } from './reverse-proxy'

const cookieKey = (key: string) => `x-split-key-${key}`

export const getSplitConfig = (
  ctx: GetServerSidePropsContext,
  splitKey: string
): SplitConfig => {
  const distributions: Record<string, Distribution> =
    getConfig().serverRuntimeConfig.splits[splitKey]
  const cookie = parseCookies(ctx)
  const cookieValue = cookie[cookieKey(splitKey)]
  if (cookieValue && distributions[cookieValue])
    return {
      branch: cookieValue,
      ...distributions[cookieValue]
    }

  const keys = Object.keys(distributions)
  const key = keys[Math.floor(Math.random() * keys.length)]
  return {
    branch: key,
    ...distributions[key]
  }
}

export const sticky = (
  ctx: GetServerSidePropsContext,
  config: SplitConfig,
  splitKey: string
): ReturnType<typeof setCookie> =>
  setCookie(ctx, cookieKey(splitKey), config.branch, config.cookie)

export const getPath = (config: SplitConfig, query: ParsedUrlQuery): string => {
  const keys: {
    name: string
    prefix: string
    suffix: string
    pattern: string
    modifier: '*' | '?'
  }[] = []
  pathToRegexp.pathToRegexp(config.path, keys)
  let newPath = config.path
  for (const key of keys) {
    const value = query[key.name]
    if (value && Array.isArray(value))
      newPath = newPath.replace(
        `:${key.name}${key.modifier}`,
        value.map((v) => `${key.prefix}${v}${key.suffix}`).join('')
      )
    else if (value)
      newPath = newPath.replace(
        `:${key.name}${key.modifier}`,
        `${key.prefix}${value}${key.suffix}`
      )
    else newPath = newPath.replace(`:${key.name}${key.modifier}`, '')
    newPath = newPath.replace(`(${key.pattern})`, '')
  }

  return newPath.replace(/\/\//g, '/')
}

export const runReverseProxy = async (
  { req, res, query }: GetServerSidePropsContext,
  config: SplitConfig
): Promise<void> => {
  let url: null | URL = null
  const headers = { ...req.headers }
  delete headers['user-agent']
  try {
    url = new URL(config.host)
  } catch (_e) {
    // no operation
  }
  await reverseProxy(
    { req, res },
    {
      host: url?.hostname ?? config.host,
      method: req.method,
      port: url?.port,
      path: getPath(config, query),
      headers
    },
    url === null || url.protocol === 'https:'
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const config = getSplitConfig(ctx, ctx.query.__key as string)
  sticky(ctx, config, ctx.query.__key as string)

  await runReverseProxy(ctx, config)

  return {
    props: {}
  }
}
