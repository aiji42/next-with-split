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
    originalRewrite: (() => Promise<Rewrites>) | undefined
  ) =>
  async (): Promise<Rewrites> => {
    const rewrite = await originalRewrite?.()
    const active = process.env.VERCEL_ENV === 'production'

    if (!active) return mergeRewrites(rewrite, [])

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
