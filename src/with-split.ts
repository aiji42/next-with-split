import { SplitOptions } from './types'
import { makeRuntimeConfig } from './make-runtime-config'
import { NextConfig } from 'next/dist/server/config'
import { exec } from 'child_process'

type WithSplitArgs = {
  splits?: SplitOptions
  currentBranch?: string
  isOriginal?: boolean
  hostname?: string
}

export const withSplit =
  ({ splits: _splits = {}, ...manuals }: WithSplitArgs) =>
  (nextConfig: NextConfig): NextConfig => {
    if (process.env.SPLIT_DISABLE) {
      // TODO: uninstall middleware if auto install mode
      return nextConfig
    }

    // Load the configuration using Spectrum.
    const splits: SplitOptions =
      Object.keys(_splits).length > 0
        ? _splits
        : JSON.parse(process.env.SPLIT_CONFIG_BY_SPECTRUM ?? '{}')

    const isMain =
      !!process.env.SPLIT_ACTIVE ||
      (manuals?.isOriginal ?? process.env.VERCEL_ENV === 'production')
    const assetHost = manuals?.hostname ?? process.env.VERCEL_URL
    const currentBranch =
      manuals?.currentBranch ?? process.env.VERCEL_GIT_COMMIT_REF ?? ''

    if (Object.keys(splits).length > 0 && isMain) {
      console.log('Split tests are active.')
      console.table(
        Object.entries(splits).map(([testKey, options]) => {
          if (!options.path)
            throw new Error(
              `Incomplete Format: The \`path\` is not set on \`${testKey}\`.`
            )
          return {
            testKey,
            path: options.path,
            distributions: Object.keys(options.hosts)
          }
        })
      )
    }

    getMiddlewarePaths(splits).forEach((path) => {
      // TODO: check filename _middleware.{ts, js}
      // TODO: Allowing commands to be overridden for development
      // TODO: Allow the user to choose not to control it with environment variables.
      exec(
        `npx next-with-split ${isMain ? 'install' : 'remove'} ${path}`,
        (err, stdout, stderr) => {
          if (err) throw err
          stdout && console.log(stdout)
          stderr && console.log(stderr)
        }
      )
    })

    if (isSubjectedSplitTest(splits, currentBranch))
      process.env.NEXT_PUBLIC_IS_TARGET_SPLIT_TESTING = 'true'

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
      } as NextConfig['images'],
      env: {
        ...nextConfig.env,
        ...(isMain && {
          NEXT_WITH_SPLIT_RUNTIME_CONFIG: JSON.stringify(
            makeRuntimeConfig(splits)
          )
        })
      }
    }
  }

const isSubjectedSplitTest = (
  splits: SplitOptions,
  currentBranch: string
): boolean => {
  const branches = Object.values(splits).flatMap(({ hosts }) =>
    Object.keys(hosts)
  )
  return branches.includes(currentBranch)
}

const getMiddlewarePaths = (splits: SplitOptions): string[] => {
  return Object.values(splits)
    .map(({ middleware }) => middleware)
    .filter((path): path is string => !!path)
}
