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
            convertHost(branch, host)
          ])
        ),
        cookie: { path: '/', maxAge: 60 ** 2 * 24 * 1000, ...option.cookie }
      }
    }),
    {}
  )
}

const convertHost = (
  branch: string,
  host: SplitOptions[string]['hosts'][string]
): RuntimeConfig[string]['hosts'][string] => {
  const isOriginal = ORIGINAL_DISTRIBUTION_KEYS.includes(branch)
  return typeof host === 'string'
    ? {
        weight: 1,
        host: correctHost(host),
        isOriginal
      }
    : {
        ...host,
        host: correctHost(host.host),
        isOriginal
      }
}

const correctHost = (host: string): string => {
  const newHost = /^https?:\/\/.+/.test(host) ? host : `https://${host}`
  try {
    new URL(newHost)
    return newHost
  } catch (_) {
    throw new Error(`Incorrect host format: ${host}`)
  }
}
