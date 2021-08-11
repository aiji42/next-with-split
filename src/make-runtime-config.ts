import { Distribution, RuntimeConfig, SplitOptions } from './types'
import { ORIGINAL_DISTRIBUTION_KEYS } from './constants'

export const makeRuntimeConfig = (options: SplitOptions): RuntimeConfig => {
  return Object.entries(options).reduce<RuntimeConfig>(
    (res, [key, option]) => ({
      ...res,
      [key]: Object.entries(option.hosts).reduce<RuntimeConfig[string]>(
        (res, [branch, host]) => {
          const dist: Distribution = {
            host: typeof host === 'string' ? host : host.host,
            path: option.path,
            cookie: { path: '/', maxAge: 60 * 60 * 24, ...option.cookie },
            isOriginal: ORIGINAL_DISTRIBUTION_KEYS.includes(branch),
            weight: typeof host === 'string' ? 1 : host.weight
          }
          return {
            ...res,
            [branch]: dist
          }
        },
        {}
      )
    }),
    {}
  )
}
