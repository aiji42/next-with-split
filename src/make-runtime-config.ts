import { RuntimeConfig, SplitOptions } from './types'
import { ORIGINAL_DISTRIBUTION_KEYS } from './constants'

export const makeRuntimeConfig = (options: SplitOptions): RuntimeConfig => {
  return Object.entries(options).reduce<RuntimeConfig>(
    (res, [key, option]) => ({
      ...res,
      [key]: {
        path: option.path,
        hosts: Object.fromEntries(
          Object.entries(option.hosts).map(([branch, host]) => [
            branch,
            typeof host === 'string'
              ? {
                  weight: 1,
                  host,
                  isOriginal: ORIGINAL_DISTRIBUTION_KEYS.includes(branch)
                }
              : {
                  ...host,
                  isOriginal: ORIGINAL_DISTRIBUTION_KEYS.includes(branch)
                }
          ])
        ),
        cookie: { path: '/', maxAge: 60 ** 2 * 24 * 1000, ...option.cookie }
      }
    }),
    {}
  )
}
