import { prepareSplitChallenge } from './prepare-split-challenge'
import { makeRewrites } from './make-rewrites'
import { Manuals, Rewrites, SplitOptions } from './types'
import { makeRuntimeConfig } from './makeRuntimeConfig'

type WithSplitArgs = {
  splits?: SplitOptions
  challengeFileExisting?: boolean // TODO: Discontinued in the next major update
  manuals?: Manuals
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
  const { splits = {}, challengeFileExisting, manuals, ...nextConfig } = args
  const isMain = manuals?.isOriginal ?? process.env.VERCEL_ENV === 'production'
  const assetHost = manuals?.hostname ?? process.env.VERCEL_URL
  const currentBranch =
    manuals?.currentBranch ?? process.env.VERCEL_GIT_COMMIT_REF ?? ''

  if (challengeFileExisting !== undefined)
    console.warn(
      'Deprecated: `challengeFileExisting` will be deprecated in the next major update. Use `manuals.prepared` instead.'
    )

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

  prepareSplitChallenge(isMain, manuals?.prepared ?? challengeFileExisting) // TODO: Discontinued in the next major update

  return {
    ...nextConfig,
    assetPrefix:
      nextConfig.assetPrefix ||
      (!isMain && assetHost ? `https://${assetHost}` : ''),
    images: {
      ...nextConfig.images,
      path:
        nextConfig.images?.path ||
        (!isMain && assetHost ? `https://${assetHost}/_next/image` : undefined)
    },
    serverRuntimeConfig: {
      ...nextConfig.serverRuntimeConfig,
      splits: makeRuntimeConfig(splits)
    },
    rewrites: makeRewrites(splits, nextConfig.rewrites, isMain)
  }
}
