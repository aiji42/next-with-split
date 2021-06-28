import {Rewrite} from 'next/dist/lib/load-custom-routes';

type Rewrites = {
  beforeFiles?: Rewrite[]
  afterFiles?: Rewrite[]
  fallback?: Rewrite[]
}

const mergeRewrites = (
  originalRewrites: Rewrites | Rewrite[] | undefined,
  newRewirites: Pick<Required<Rewrites>, 'beforeFiles'>
): Rewrites => {
  if (!originalRewrites) return newRewirites
  if (Array.isArray(originalRewrites))
    return {
      beforeFiles: {
        
        ...newRewirites.beforeFiles
      }
    }

}