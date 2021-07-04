import { findPagesDir } from 'next/dist/lib/find-pages-dir'
import { writeFileSync } from 'fs'

const scriptText = `
export { getServerSideProps } from 'next-with-split'
const SplitChallenge = () => null
export default SplitChallenge
`

export const prepareSplitChallenge = (): void => {
  if (process.env.VERCEL_ENV === 'production')
    writeFileSync(`${findPagesDir('')}/_split-challenge/[__key].js`, scriptText)
}

