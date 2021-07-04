import { IncomingMessage, request as httpRequest, ServerResponse } from 'http'
import { request, RequestOptions } from 'https'

export const reverseProxy = async ({ req, res }: { req: IncomingMessage, res: ServerResponse }, options: RequestOptions, isSecure?: boolean) => {
  return new Promise(() => {
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
        res.writeHead(serverRes.statusCode ?? 0, serverRes.headers)
        serverRes.pipe(res)
      })
    req.pipe(serverReq)
  })
}