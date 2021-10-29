import { NextFetchEvent, NextRequest, NextResponse } from 'next/server'
import { GetServerSidePropsContext } from 'next'
import getConfig from 'next/config'
import { setCookie } from 'nookies'
import { CookieSerializeOptions } from 'cookie'


export const middleware = (req: NextRequest) => {
  // console.log(req)
  if (req.cookies['__prerender_bypass']) return

  const config = getSplitConfig(req, 'test1')
  console.log(config)


  // const config = getSplitConfig(ctx, <string>ctx.query.__key)
  // sticky(ctx, config, ctx.query.__key as string)



  // const res = NextResponse.rewrite('https://nextjs-split-test-git-abtest-example-2021-07-04-aiji42.vercel.app/foo/bar/hoge')

  // return res
  // return req
}

const cookieKey = (key: string) => `x-split-key-${key}`

export type SplitConfig = { branch: string } & Distribution

export type Distribution = {
  host: string
  path: string
  cookie: CookieSerializeOptions
  isOriginal: boolean
  weight: number
}

const getSplitConfig = (
  req: NextRequest,
  splitKey: string
): SplitConfig => {
  const splits = process.env.splits as unknown as Record<string, Record<string, Distribution>>
  const distributions = splits[splitKey]

  const cookieValue = req.cookies[cookieKey(splitKey)]
  if (cookieValue && distributions[cookieValue])
    return {
      branch: cookieValue,
      ...distributions[cookieValue]
    }

  const keys = Object.entries(distributions).reduce<string[]>(
    (res, [key, { weight }]) => [...res, ...new Array(weight).fill(key)],
    []
  )
  const key = keys[Math.floor(Math.random() * keys.length)]
  return {
    branch: key,
    ...distributions[key]
  }
}

const sticky = (
  ctx: GetServerSidePropsContext,
  config: SplitConfig,
  splitKey: string
): ReturnType<typeof setCookie> =>
  setCookie(ctx, cookieKey(splitKey), config.branch, config.cookie)
