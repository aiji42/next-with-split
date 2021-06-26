import { checkExistingIndex } from './check-existing-index'
import { checkExistingSplitChallenge } from './check-existing-split-challenge'
import { info, warn } from './log'

const rule = (source: string, destination: string, additional = {}) => ({
  source,
  destination,
  ...additional
})
const has = (value = 'original') => [
  {
    type: 'cookie',
    key: 'next-with-split',
    value
  }
]

type Mappings = { [branch: string]: string }

const makeRewrites =
  (mappings: Mappings, rootPage: string, active: boolean) => async () => {
    if (!active || Object.keys(mappings).length < 2)
      return [rule('/', `/${rootPage}`)]

    return {
      beforeFiles: [
        ...Object.entries(mappings)
          .map(([branch, origin]) =>
            [
              rule('/', `${origin}/${rootPage}/`, { has: has(branch) }),
              rule('/:path*/', `${origin}/:path*`, { has: has(branch) }),
              origin
                ? rule('/:path*', `${origin}/:path*`, { has: has(branch) })
                : null
            ].filter(Boolean)
          )
          .flat(),
        rule('/:path*/', '/_split-challenge')
      ]
    }
  }

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
  active: process.env.VERCEL_ENV === 'production'
}

type NextWithSplitArgs = {
  splits: Partial<Options>
  env?: Record<string, string>
  trailingSlash?: boolean
  [x: string]: unknown
}

export const nextWithSplit = (args: NextWithSplitArgs) => {
  const { splits, ...nextConfig } = args
  const options = { ...defaultOptions, ...(splits ?? {}) }
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
    if (process.env.VERCEL_GIT_COMMIT_REF && process.env.VERCEL_GIT_COMMIT_REF !== splits.mainBranch)
      warn('Detected that splits.active is set to true in the challenger branch. This can cause serious problems such as redirection loops.')
  }

  return {
    ...nextConfig,
    env: {
      ...(nextConfig.env ?? {}),
      SPLIT_TEST_BRANCHES: JSON.stringify(Object.keys(mappings))
    },
    trailingSlash: true,
    assetPrefix: mappings[process.env.VERCEL_GIT_COMMIT_REF ?? ''] ?? '',
    rewrites: makeRewrites(mappings, options.rootPage, options.active)
  }
}
