import { prepareSplitChallenge } from './prepare-split-challenge'
import { makeRewrites } from './make-rewrites'
import { Rewrites, SplitOptions } from './types'
import { makeRuntimeConfig } from './makeRuntimeConfig'

type WithSplitArgs = {
  splits?: SplitOptions
  challengeFileExisting?: boolean
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
  const { splits = {}, challengeFileExisting, ...nextConfig } = args
  const isProd = process.env.VERCEL_ENV === 'production'

  if (Object.keys(splits).length > 0 && isProd) {
    console.log('Split tests are active.')
    console.table(
      Object.entries(splits).map(([testKey, options]) => ({
        testKey,
        path: options.path,
        distributions: Object.keys(options.hosts)
      }))
    )
  }

  const branches = Object.values(splits)
    .map(({ hosts }) => Object.keys(hosts))
    .flat()
  if (branches.includes(process.env.VERCEL_GIT_COMMIT_REF ?? ''))
    process.env.NEXT_PUBLIC_IS_TARGET_SPLIT_TESTING = 'true'

  prepareSplitChallenge(isProd, challengeFileExisting)

  return {
    ...nextConfig,
    assetPrefix:
      nextConfig.assetPrefix ||
      (!isProd && process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : ''),
    images: {
      ...nextConfig.images,
      path:
        nextConfig.images?.path ||
        (!isProd && process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}/_next/image`
          : undefined)
    },
    serverRuntimeConfig: {
      ...nextConfig.serverRuntimeConfig,
      splits: makeRuntimeConfig(splits)
    },
    rewrites: makeRewrites(splits, nextConfig.rewrites, isProd)
  }
}
