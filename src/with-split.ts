import { SplitOptions } from './types'
import { makeRuntimeConfig } from './make-runtime-config'
import { NextConfig } from 'next/dist/server/config'
import { ImageConfig } from 'next/dist/server/image-config'
import { exec } from 'child_process'

type WithSplitArgs = {
  splits?: SplitOptions
  currentBranch?: string
  isOriginal?: boolean
  hostname?: string
  middleware?: { manage?: boolean; paths?: string[] }
}

export const withSplit =
  ({
    splits: _splits = {},
    middleware = { manage: false },
    ...manuals
  }: WithSplitArgs) =>
  (nextConfig: NextConfig): NextConfig => {
    // Load the configuration using Spectrum.
    const splits: SplitOptions =
      Object.keys(_splits).length > 0
        ? _splits
        : JSON.parse(process.env.SPLIT_CONFIG_BY_SPECTRUM ?? '{}')

    if (['true', '1'].includes(process.env.SPLIT_DISABLE ?? '')) {
      middleware.manage && manageMiddleware(middleware.paths ?? [], 'remove')
      return nextConfig
    }

    const isMain =
      ['true', '1'].includes(process.env.SPLIT_ACTIVE ?? '') ||
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
              `Invalid format: The \`path\` is not set on \`${testKey}\`.`
            )
          return {
            testKey,
            path: options.path,
            distributions: Object.keys(options.hosts)
          }
        })
      )
    }

    middleware.manage &&
      manageMiddleware(middleware.paths ?? [], isMain ? 'install' : 'remove')

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
      } as ImageConfig,
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

const manageMiddleware = (paths: string[], command: 'install' | 'remove') => {
  paths.forEach((path) => {
    exec(`npx next-with-split ${command} ${path}`, (err, stdout, stderr) => {
      if (stdout) console.log(stdout)
      if (err) {
        if (stderr) throw new Error(stderr)
        throw err
      }
      if (stderr) throw new Error(stderr)
    })
  })

  // TODO: Explores the pages directory and alerts if there is middleware outside of its control.
}
