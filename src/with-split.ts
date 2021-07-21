import { prepareSplitChallenge } from './prepare-split-challenge'
import { makeRewrites } from './make-rewrites'
import { SplitOptions } from './types'
import { makeRuntimeConfig } from './make-runtime-config'
import { NextConfig } from 'next/dist/next-server/server/config-shared'

type WithSplitArgs = {
  splits?: SplitOptions
  prepared?: boolean
  currentBranch?: string
  isOriginal?: boolean
  hostname?: string
}

export const withSplit =
  ({ splits = {}, ...manuals }: WithSplitArgs) =>
  (nextConfig: Partial<NextConfig>): Partial<NextConfig> => {
    if (process.env.SPLIT_DISABLE) return nextConfig

    const isMain =
      !!process.env.SPLIT_ACTIVE ||
      (manuals?.isOriginal ?? process.env.VERCEL_ENV === 'production')
    const assetHost = manuals?.hostname ?? process.env.VERCEL_URL
    const currentBranch =
      manuals?.currentBranch ?? process.env.VERCEL_GIT_COMMIT_REF ?? ''

    if (Object.keys(splits).length > 0 && isMain) {
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

    prepareSplitChallenge(isMain, manuals?.prepared)

    return {
      ...nextConfig,
      assetPrefix:
        nextConfig.assetPrefix ||
        (!isMain && assetHost ? `https://${assetHost}` : ''),
      images: {
        ...nextConfig.images,
        path:
          nextConfig.images?.path ||
          (!isMain && assetHost
            ? `https://${assetHost}/_next/image`
            : undefined)
      },
      serverRuntimeConfig: {
        ...nextConfig.serverRuntimeConfig,
        splits: makeRuntimeConfig(splits)
      },
      rewrites: <NextConfig['rewrites']>(
        makeRewrites(splits, nextConfig.rewrites, isMain)
      )
    }
  }
