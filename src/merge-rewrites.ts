import { Rewrite } from 'next/dist/lib/load-custom-routes'

type Rewrites = {
  beforeFiles?: Rewrite[]
  afterFiles?: Rewrite[]
  fallback?: Rewrite[]
}

export const mergeRewrites = (
  originalRules: Rewrites | Rewrite[] | undefined,
  newRules: Rewrite[]
): Rewrites | Rewrite[] => {
  if (!originalRules) return {
    beforeFiles: newRules
  }
  if (Array.isArray(originalRules)) return [
    ...newRules,
    ...originalRules
  ]

  return {
    ...originalRules,
    beforeFiles: [
      ...newRules,
      ...originalRules.beforeFiles ?? []
    ]
  }
}
