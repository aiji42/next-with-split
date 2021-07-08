import { findPagesDir } from 'next/dist/lib/find-pages-dir'
import { writeFileSync, existsSync, mkdirSync } from 'fs'

const scriptText = `export { getServerSideProps } from 'next-with-split'
const SplitChallenge = () => null
export default SplitChallenge
`

export const prepareSplitChallenge = (
  isMain: boolean,
  prepared?: boolean
): void => {
  if (!isMain || prepared) return
  let dir = ''
  try {
    dir = `${findPagesDir('')}/_split-challenge`
  } catch (e) {
    console.error(e.message)
    console.log(`> Could not create the necessary file for the split test.
Create the file yourself and set \`challengeFileExisting: true\`.
The code in the file should look like this
// pages/_split-challenge/[__key].js
${scriptText}`)
    process.exit(1)
    return
  }
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  if (
    existsSync(`${dir}/[__key].ts`) ||
    existsSync(`${dir}/[__key].tsx`) ||
    existsSync(`${dir}/[__key].js`) ||
    existsSync(`${dir}/[__key].jsx`)
  )
    return
  writeFileSync(`${dir}/[__key].js`, scriptText)
}
