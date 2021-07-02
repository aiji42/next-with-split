import { GetServerSideProps } from 'next'
import { setCookie } from 'nookies'
import { createServer, OutgoingHttpHeader, OutgoingHttpHeaders, request } from 'http'

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  // const branches: string[] = JSON.parse(process.env.SPLIT_TEST_BRANCHES ?? '[]')
  console.log(req.url)
  // setCookie(
  //   { res },
  //   'next-with-split',
  //   'aaa',
  //   { path: '/' }
  // )
  await new Promise((resolve) => {
    const serverReq = request({
      host: 'localhost',
      port: 3000,
      method: req.method,
      path: `/top?next-with-split=aaa`,
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
        res.end()
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