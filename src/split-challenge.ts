import { GetServerSideProps } from 'next'
import { setCookie } from 'nookies'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const branches: string[] = JSON.parse(process.env.SPLIT_TEST_BRANCHES ?? '[]')
  console.log(ctx.req.url)
  setCookie(
    ctx,
    'next-with-split',
    branches[Math.floor(Math.random() * branches.length)],
    { path: '/' }
  )
  ctx.res.writeHead(302, { Location: ctx.req.url ?? '/' })
  ctx.res.end()

  return {
    props: {}
  }
}
