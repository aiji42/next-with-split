import { checkExistingSplitChallenge } from './check-existing-split-challenge'
import { info } from './log'
import { makeRewrites } from './make-rewrites'
import { Rewrites, RuntimeConfig, SplitOptions } from './types'

type WithSplitArgs = {
  splits?: SplitOptions
  rewrites?: () => Promise<Rewrites>
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
  rewrites: () => Promise<Rewrites>
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

  if (Object.keys(splits).length > 0 && process.env.VERCEL_ENV === 'production') {
    info('Split tests are active.')
    console.table(
      Object.entries(splits).map(([testKey, options]) => ({
        testKey,
        path: options.path,
        abcs: Object.keys(options.hosts)
      }))
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
      splits,
      nextConfig.rewrites
    )
  }
}
