import { findPageFile } from 'next/dist/server/lib/find-page-file'
import { findPagesDir } from 'next/dist/lib/find-pages-dir'
import { error, info } from './log'

export const checkExistingSplitChallenge = async (): Promise<boolean> => {
  const pagesDir = findPagesDir('')
  const res = await findPageFile(findPagesDir(''), '_split-challenge/[__key]', [
    'mdx',
    'jsx',
    'js',
    'ts',
    'tsx'
  ])

  if (res) return true
  error(
    `Not existing ${pagesDir}/_split-challenge/[__key].js(ts).`
  )
  info(
    `Plese create ${pagesDir}/_split-challenge.js or .ts and and copy and paste the following three lines.`
  )
  console.log(`
    export { getServerSideProps } from 'next-with-split'
    const SplitChallenge = () => null
    export default SplitChallenge
`)
  return false
}

