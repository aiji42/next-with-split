import { Rewrite, RouteHas } from 'next/dist/lib/load-custom-routes'
import { mergeRewrites } from './merge-rewrites'
import { Rewrites, SplitOptions } from './types'

const rule = (
  source: string,
  destination: string,
  has: RouteHas[]
): Rewrite => ({
  source,
  destination,
  has
})

export const makeRewrites =
  (
    options: SplitOptions,
    originalRewrite: (() => Promise<Rewrites>) | undefined,
    isMain: boolean
  ) =>
  async (): Promise<Rewrites> => {
    const rewrite = await originalRewrite?.()
    if (!isMain) return mergeRewrites(rewrite, [])

    return mergeRewrites(
      rewrite,
      Object.entries(options).map(([key, option]) =>
        // Access from the browser will be directed to the RP,
        // but access from the RP will be directed to the normal path.
        rule(option.path, `/_split-challenge/${key}`, [
          { type: 'header', key: 'user-agent' }
        ])
      )
    )
  }
