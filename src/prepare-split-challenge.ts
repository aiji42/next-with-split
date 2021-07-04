import { findPagesDir } from 'next/dist/lib/find-pages-dir'
import { writeFileSync, existsSync, mkdirSync } from 'fs'

const scriptText = `
export { getServerSideProps } from 'next-with-split'
const SplitChallenge = () => null
export default SplitChallenge
`

export const prepareSplitChallenge = (): void => {
  if (process.env.VERCEL_ENV !== 'production') return
  const dir = `${findPagesDir('')}/_split-challenge`
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(`${dir}/[__key].js`, scriptText)
}
