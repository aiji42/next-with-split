import { IncomingMessage, request as httpRequest, ServerResponse } from 'http'
import { request, RequestOptions } from 'https'

export const _reverseProxy = (
  { req, res }: { req: IncomingMessage; res: ServerResponse },
  options: RequestOptions,
  isSecure?: boolean
): void => {
  const serverReq = (isSecure ? request : httpRequest)({
    ...options,
    headers: {
      ...options.headers,
      ...(options.host ? { host: options.host } : {})
    }
  })
    .on('error', () => res.writeHead(502).end())
    .on('timeout', () => res.writeHead(504).end())
    .on('response', (serverRes) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { 'x-robots-tag': _ignore, ...headers } = serverRes.headers
      res.writeHead(serverRes.statusCode ?? 0, headers)
      serverRes.pipe(res)
    })
  req.pipe(serverReq)
}

export const reverseProxy = async (
  ...args: Parameters<typeof _reverseProxy>
): Promise<void> => {
  return new Promise(() => {
    _reverseProxy(...args)
  })
}
