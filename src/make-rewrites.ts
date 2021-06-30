import { Rewrite, RouteHas } from 'next/dist/lib/load-custom-routes'
import { mergeRewrites } from './merge-rewrites'
const rule = (
  source: string,
  destination: string,
  additional = {}
): Rewrite => ({
  source,
  destination,
  ...additional
})
const has = (value: string): RouteHas[] => [
  {
    type: 'cookie',
    key: 'next-with-split',
    value
  }
]

export type Mappings = { [branch: string]: string }

export type Rewrites = {
  beforeFiles?: Rewrite[]
  afterFiles?: Rewrite[]
  fallback?: Rewrite[]
}

export const makeRewrites =
  (
    mappings: Mappings,
    rootPage: string,
    active: boolean,
    originalRewrite: (() => Promise<Rewrites | Rewrite[]>) | undefined
  ) =>
  async (): Promise<Rewrites> => {
    const rewrite = await originalRewrite?.()
    if (!active || Object.keys(mappings).length < 2) {
      console.log(
        mergeRewrites(rewrite, {
          beforeFiles: [rule('/', `/${rootPage}`)]
        })
      )

      return mergeRewrites(rewrite, {
        beforeFiles: [rule('/', `/${rootPage}`)]
      })
    }

    console.log(
      mergeRewrites(rewrite, {
        beforeFiles: [
          ...Object.entries(mappings)
            .map(([branch, origin]) => [
              rule('/', `${origin}/${rootPage}/`, { has: has(branch) }),
              rule('/:path*/', `${origin}/:path*`, { has: has(branch) }),
              ...(origin
                ? [rule('/:path*', `${origin}/:path*`, { has: has(branch) })]
                : [])
            ])
            .flat(),
          rule('/foo/bar/', `http://localhost:3001/foo/bar`, { has: has('challenger') }),

          rule('/:path*/', '/_split-challenge')
        ]
      })
    )

    return mergeRewrites(rewrite, {
      beforeFiles: [
        ...Object.entries(mappings)
          .map(([branch, origin]) => [
            rule('/', `${origin}/${rootPage}/`, { has: has(branch) }),
            rule('/:path*/', `${origin}/:path*`, { has: has(branch) }),
            ...(origin
              ? [rule('/:path*', `${origin}/:path*`, { has: has(branch) })]
              : [])
          ])
          .flat(),
        rule('/:path*/', '/_split-challenge')
      ]
    })
  }
