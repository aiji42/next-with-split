import { GetServerSideProps } from 'next'
import { setCookie, parseCookies } from 'nookies'
import { IncomingMessage, ServerResponse } from 'http'
import { request, RequestOptions } from 'https'

const cookieName = `x-split-key`
const branches: Record<string, { host: string; path: string }> = {
  original: { host: 'lifedot-list-o3j04lux4-ending.vercel.app', path: '/ohaka/pref-tokyo/list/' },
  challenger: { host: 'lifedot-list-o3j04lux4-ending.vercel.app', path: '/ohaka/pref-tokyo/list/' }
}
const arrayBranches = Object.entries(branches)

const reverseProxy = async (req: IncomingMessage, res: ServerResponse, options: RequestOptions) => {
  return new Promise(() => {
    const serverReq = request({
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

export const getServerSideProps: GetServerSideProps = async ({ req, res, query }) => {
  const cookie = parseCookies({ req })
  const cookieValue = cookie[cookieName]
  const [key, branch] = cookieValue && branches[cookieValue] ? [cookieValue, branches[cookieValue]] : arrayBranches[Math.floor(Math.random() * arrayBranches.length)]
  setCookie(
    { res },
    cookieName,
    key,
    { path: '/' }
  )

  await reverseProxy(req, res, {
    host: branch.host,
    method: req.method,
    path: branch.path.replace(/:path\*/, (Array.isArray(query.path) ? query.path.join('/') : query.path) ?? ''),
    headers: { ...req.headers, host: branch.host },
  })

  return {
    props: {}
  }
}

const Null = () => null

export default Null