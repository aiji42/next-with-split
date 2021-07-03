import { GetServerSideProps } from 'next'
import { setCookie, parseCookies } from 'nookies'
import { IncomingMessage, ServerResponse } from 'http'
import { request, RequestOptions } from 'https'
import { ParsedUrlQuery } from 'querystring'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as pathToRegexp from 'next/dist/compiled/path-to-regexp'
import getConfig from 'next/config'
import { Distribution } from './types'

const reverseProxy = async (req: IncomingMessage, res: ServerResponse, options: RequestOptions) => {
  return new Promise(() => {
    const serverReq = request({
      ...options,
      headers: {
        ...options.headers,
        ...(options.host ? { host: options.host } : {})
      }
    })
      .on('error', () => res.writeHead(502).end())
      .on('timeout', () => res.writeHead(504).end())
      .on('response', (serverRes) => {
        res.writeHead(serverRes.statusCode ?? 0, serverRes.headers)
        serverRes.pipe(res)
      })
    req.pipe(serverReq)
  })
}

type SplitConfig = { branch: string } & Distribution

const cookieKey = (key: string) => `x-split-key-${key}`

const getSplitConfig = (req: IncomingMessage, splitKey: string): SplitConfig => {
  const distributions: Record<string, Distribution> = getConfig().serverRuntimeConfig.splits[splitKey]
  const cookie = parseCookies({ req })
  const cookieValue = cookie[cookieKey(splitKey)]
  if (cookieValue && distributions[cookieValue]) return {
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

const sticky = (res: ServerResponse, config: SplitConfig, splitKey: string) => {
  setCookie(
    { res },
    cookieKey(splitKey),
    config.branch,
    config.cookie
  )
}

const getPath = (config: SplitConfig, query: ParsedUrlQuery) => {
  const keys: {
    name: string,
    prefix: string,
    suffix: string,
    pattern: string,
    modifier: '*' | '?'
  }[] = []
  pathToRegexp.pathToRegexp(config.path, keys)
  let newPath = config.path
  for (const key of keys) {
    const value = query[key.name]
    if (value && Array.isArray(value))
      newPath = newPath.replace(`:${key.name}${key.modifier}`, value.map((v) => `${key.prefix}${v}${key.suffix}`).join(''))
    else if (value)
      newPath = newPath.replace(`:${key.name}${key.modifier}`, `${key.prefix}${value}${key.suffix}`)
    else
      newPath = newPath.replace(`:${key.name}${key.modifier}`, '')
    newPath = newPath.replace(`(${key.pattern})`, '')
  }

  return newPath.replace(/\/\//g, '/')
}


export const getServerSideProps: GetServerSideProps = async ({ req, res, query }) => {
  const config = getSplitConfig(req, query.__key as string)
  sticky(res, config, query.__key as string)

  await reverseProxy(req, res, {
    host: config.host,
    method: req.method,
    path: getPath(config, query)
  })

  return {
    props: {}
  }
}