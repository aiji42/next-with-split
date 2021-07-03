import { Rewrite } from 'next/dist/lib/load-custom-routes'
import { checkExistingIndex } from './check-existing-index'
import { checkExistingSplitChallenge } from './check-existing-split-challenge'
import { info, warn } from './log'
import { Mappings, Rewrites, makeRewrites } from './make-rewrites'
import { CookieSerializeOptions } from 'cookie'

type Options = {
  [keyName: string]: {
    path: string
    hosts: {
      [branchName: string]: string
    }
    cookie?: CookieSerializeOptions
  }
}

type WithSplitArgs = {
  splits?: Options
  rewrites?: () => Promise<Rewrites | Rewrite[]>
  assetPrefix?: string
  serverRuntimeConfig?: {
    [x: string]: unknown
  }
  images?: {
    path?: string
    [x: string]: unknown
  }
  [x: string]: unknown
}

type WithSplitResult = Omit<Required<WithSplitArgs>, 'splits'> & {
  assetPrefix: string
  rewrites: () => Promise<Rewrites>
}

type RuntimeConfig = {
  [keyName: string]: {
    [branch: string]: { host: string; path: string; cookie: CookieSerializeOptions }
  }
}

export const withSplit = (args: WithSplitArgs): WithSplitResult => {
  const { splits = {}, ...nextConfig } = args

  const runtimeConfig = Object.entries(splits).reduce<RuntimeConfig>((res, [key, option]) => ({
    ...res,
    [key]: Object.entries(option.hosts).reduce((res, [branch, host]) => ({ ...res, [branch]: {
        host,
        path: option.path,
        cookie: { path: '/', maxAge: 60 * 60 * 24, ...option.cookie }
      } }), {})
  }), {})


  checkExistingSplitChallenge().then((res) => !res && process.exit(1))

  if (Object.keys(splits).length > 0) {
    info('Split tests are active.')
    console.table(
      Object.entries(splits).map(([key, origin]) => ({
        branch,
        targetOrigin: origin || 'original'
      }))
    )
    if (
      process.env.VERCEL_GIT_COMMIT_REF &&
      process.env.VERCEL_GIT_COMMIT_REF !== options.mainBranch
    )
      warn(
        'Detected that splits.active is set to true in the challenger branch. This can cause serious problems such as redirection loops.'
      )
  }

  return {
    ...nextConfig,
    assetPrefix: nextConfig.assetPrefix || process.env.VERCEL_URL || '',
    images: {
      ...nextConfig.images,
      path: nextConfig.images?.path || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/_next/image` : ''
    },
    serverRuntimeConfig: {
      ...nextConfig.serverRuntimeConfig,
      splits: runtimeConfig
    },
    rewrites: makeRewrites(
      mappings,
      options.rootPage,
      options.active,
      nextConfig.rewrites
    )
  }
}

const config = {
  test1: {
    path: '/hoge/hgoe/hoge/:path*/',
    hosts: {
      branch1: 'https://hogehoge.com',
      branch2: 'https://foobar.com'
    },
    cookie: {}
  }
}
