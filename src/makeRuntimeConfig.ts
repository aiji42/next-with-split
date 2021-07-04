import { RuntimeConfig, SplitOptions } from './types'

export const makeRuntimeConfig = (options: SplitOptions): RuntimeConfig => {
  return Object.entries(options).reduce<RuntimeConfig>(
    (res, [key, option]) => ({
      ...res,
      [key]: Object.entries(option.hosts).reduce(
        (res, [branch, host]) => ({
          ...res,
          [branch]: {
            host,
            path: option.path,
            cookie: { path: '/', maxAge: 60 * 60 * 24, ...option.cookie }
          }
        }),
        {}
      )
    }),
    {}
  )
}