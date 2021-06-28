import { Rewrite } from 'next/dist/lib/load-custom-routes'

type Rewrites = {
  beforeFiles?: Rewrite[]
  afterFiles?: Rewrite[]
  fallback?: Rewrite[]
}

export const mergeRewrites = (
  originalRewrites: Rewrites | Rewrite[] | undefined,
  newRewirites: Pick<Required<Rewrites>, 'beforeFiles'>
): Rewrites => {
  if (!originalRewrites) return newRewirites
  const [{ has }] = newRewirites.beforeFiles
  if (!has) {
    if (Array.isArray(originalRewrites))
      return {
        beforeFiles: [...newRewirites.beforeFiles, ...originalRewrites]
      }
    return {
      ...originalRewrites,
      beforeFiles: [
        ...newRewirites.beforeFiles,
        ...(originalRewrites.beforeFiles ?? [])
      ]
    }
  }

  if (Array.isArray(originalRewrites)) {
    const beforeFiles = [...newRewirites.beforeFiles]
    beforeFiles.splice(
      -1,
      0,
      ...originalRewrites.map((rewrite) => ({
        ...rewrite,
        has: [has[0], ...(rewrite.has ?? [])]
      }))
    )
    return {
      beforeFiles
    }
  }

  const beforeFiles = [...newRewirites.beforeFiles]
  beforeFiles.splice(
    -1,
    0,
    ...(originalRewrites.beforeFiles ?? []).map((rewrite) => ({
      ...rewrite,
      has: [has[0], ...(rewrite.has ?? [])]
    }))
  )
  return {
    ...originalRewrites,
    beforeFiles: beforeFiles
  }
}
