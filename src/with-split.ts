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
  const assetHost = process.env.VERCEL_URL
  const currentBranch = process.env.VERCEL_GIT_COMMIT_REF ?? ''

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
  if (branches.includes(currentBranch))
    process.env.NEXT_PUBLIC_IS_TARGET_SPLIT_TESTING = 'true'

  prepareSplitChallenge(isProd, challengeFileExisting)

  return {
    ...nextConfig,
    assetPrefix:
      nextConfig.assetPrefix ||
      (!isProd && assetHost ? `https://${assetHost}` : ''),
    images: {
      ...nextConfig.images,
      path:
        nextConfig.images?.path ||
        (!isProd && assetHost ? `https://${assetHost}/_next/image` : undefined)
    },
    serverRuntimeConfig: {
      ...nextConfig.serverRuntimeConfig,
      splits: makeRuntimeConfig(splits)
    },
    rewrites: makeRewrites(splits, nextConfig.rewrites, isProd)
  }
}
