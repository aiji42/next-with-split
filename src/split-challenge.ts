import { GetServerSideProps } from 'next'
import { setCookie } from 'nookies'
import { createServer, OutgoingHttpHeader, OutgoingHttpHeaders, request } from 'http'
import fetch, { Headers } from 'node-fetch'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const branches: string[] = JSON.parse(process.env.SPLIT_TEST_BRANCHES ?? '[]')
  console.log(ctx.req.url)
  setCookie(
    ctx,
    'next-with-split',
    branches[Math.floor(Math.random() * branches.length)],
    { path: '/' }
  )
  // ctx.res.writeHead(302, { Location: ctx.req.url ?? '/' })
  const res = await fetch(`http://localhost:3001${ctx.req.url}`, {
    headers: ctx.req.headers as unknown as Headers
  })
  ctx.res.writeHead(res.status, res.headers as unknown as OutgoingHttpHeaders)
  if (res.ok) {
    const text = await res.text()
    ctx.res.write(text)
  }
  ctx.res.end()


  return {
    props: {}
  }
}
