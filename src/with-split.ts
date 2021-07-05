import { prepareSplitChallenge } from './prepare-split-challenge'
import { makeRewrites } from './make-rewrites'
import { Rewrites, SplitOptions } from './types'
import { makeRuntimeConfig } from './makeRuntimeConfig'

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

  if (
    Object.keys(splits).length > 0 &&
    process.env.VERCEL_ENV === 'production'
  ) {
    console.log('Split tests are active.')
    console.table(
      Object.entries(splits).map(([testKey, options]) => ({
        testKey,
        path: options.path,
        distributions: Object.keys(options.hosts)
      }))
    )
  }

  prepareSplitChallenge(splits)

  return {
    ...nextConfig,
    assetPrefix:
      nextConfig.assetPrefix ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''),
    images: {
      ...nextConfig.images,
      path:
        nextConfig.images?.path ||
        (process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}/_next/image`
          : '/_next/image')
    },
    serverRuntimeConfig: {
      ...nextConfig.serverRuntimeConfig,
      splits: makeRuntimeConfig(splits)
    },
    rewrites: makeRewrites(splits, nextConfig.rewrites)
  }
}
