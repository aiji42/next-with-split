import { Rewrite } from 'next/dist/lib/load-custom-routes'
import { Rewrites } from './types'

export const mergeRewrites = (
  originalRules: Rewrites | undefined,
  newRules: Rewrite[]
): Rewrites => {
  if (!originalRules)
    return {
      beforeFiles: newRules
    }

  if (Array.isArray(originalRules))
    return {
      beforeFiles: newRules,
      afterFiles: originalRules
    }

  return {
    ...originalRules,
    beforeFiles: [...newRules, ...(originalRules.beforeFiles ?? [])]
  }
}
