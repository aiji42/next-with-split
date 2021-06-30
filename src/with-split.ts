import { Rewrite } from 'next/dist/lib/load-custom-routes'
import { checkExistingIndex } from './check-existing-index'
import { checkExistingSplitChallenge } from './check-existing-split-challenge'
import { info, warn } from './log'
import { Mappings, Rewrites, makeRewrites } from './make-rewrites'

type Options = {
  branchMappings: Mappings
  rootPage: string
  mainBranch: string
  active: boolean
}

const defaultOptions: Options = {
  branchMappings: {},
  rootPage: 'top',
  mainBranch: 'main',
  active: false
}

type WithSplitArgs = {
  splits?: Partial<Options>
  env?: Record<string, string>
  trailingSlash?: boolean
  rewrites?: () => Promise<Rewrites | Rewrite[]>
  [x: string]: unknown
}

type WithSplitResult = Omit<Required<WithSplitArgs>, 'splits'> & {
  assetPrefix: string
  rewrites: () => Promise<Rewrites>
}

export const withSplit = (args: WithSplitArgs): WithSplitResult => {
  const { splits, ...nextConfig } = args
  const options = {
    ...defaultOptions,
    active: process.env.VERCEL_ENV === 'production',
    ...(splits ?? {})
  }
  const mappings = { [options.mainBranch]: '', ...options.branchMappings }

  checkExistingSplitChallenge().then((res) => !res && process.exit(1))
  checkExistingIndex().then((res) => res && process.exit(1))

  if ('trailingSlash' in nextConfig && !nextConfig.trailingSlash) {
    warn(
      'You cannot use `trailingSlash: false` when using `next-with-split`. Force override to true.'
    )
  }

  if (options.active && Object.keys(mappings).length > 1) {
    info('Split tests are active.')
    console.table(
      Object.entries(mappings).map(([branch, origin]) => ({
        branch,
        tergetOrigin: origin || 'original'
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
    env: {
      ...(nextConfig.env ?? {}),
      SPLIT_TEST_BRANCHES: JSON.stringify(Object.keys(mappings))
    },
    ...(process.env.VERCEL_GIT_COMMIT_REF === options.mainBranch
      ? { trailingSlash: true }
      : {}),
    assetPrefix: mappings[process.env.VERCEL_GIT_COMMIT_REF ?? ''] ?? '',
    rewrites: makeRewrites(
      mappings,
      options.rootPage,
      options.active,
      nextConfig.rewrites
    )
  }
}
