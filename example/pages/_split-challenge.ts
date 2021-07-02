import { GetServerSideProps } from 'next'
import { setCookie, parseCookies } from 'nookies'
import { createServer, OutgoingHttpHeader, OutgoingHttpHeaders, request } from 'http'

export const getServerSideProps: GetServerSideProps = async ({ req, res, query, ...ress }) => {
  // const branches: string[] = JSON.parse(process.env.SPLIT_TEST_BRANCHES ?? '[]')
  console.log(req.url)
  console.log(query)
  console.log(ress)

  const branches: Record<string, { host: string; port: number, path: string }> = {
    original: { host: 'localhost', port: 3001, path: '/foo/:path*' },
    challenger: { host: 'localhost', port: 3002, path: '/foo/:path*' }
  }
  const arrayBranches = Object.entries(branches)

  const cookie = parseCookies({ req })

  await new Promise((resolve) => {
    const [key, branch] = cookie['next-with-split'] ? [cookie['next-with-split'], branches[cookie['next-with-split']]] : arrayBranches[Math.floor(Math.random() * arrayBranches.length)]
    setCookie(
      { res },
      'next-with-split',
      key,
      { path: '/' }
    )
    const serverReq = request({
      host: branch.host,
      port: branch.port,
      method: req.method,
      path: branch.path.replace(/:path\*/, (Array.isArray(query.path) ? query.path.join('/') : query.path) ?? ''),
      headers: req.headers,
    }).on('error', () => res.writeHead(502).end())
      .on('timeout', () => res.writeHead(504).end())
      .on('response', serverRes => {
        console.log('response')
        res.writeHead(serverRes.statusCode ?? 0, serverRes.headers)
        serverRes.pipe(res)
      })
      .on('close', () => {
        console.log('close')
        // res.end()
        // serverReq.end()
        // resolve(false)
      })
    req.pipe(serverReq)
  })

  return {
    props: {}
  }
}

const hoge = () => null

export default hoge