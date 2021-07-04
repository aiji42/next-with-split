import { Rewrite } from 'next/dist/lib/load-custom-routes'
import { mergeRewrites } from './merge-rewrites'
import { Rewrites, SplitOptions } from './types'

const rule = (source: string, destination: string): Rewrite => ({
  source,
  destination
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
        rule(option.path, `/_split-challenge/${key}`)
      )
    )
  }
