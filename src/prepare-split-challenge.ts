import { findPagesDir } from 'next/dist/lib/find-pages-dir'
import { writeFileSync, existsSync, mkdirSync } from 'fs'

const scriptText = `export { getServerSideProps } from 'next-with-split'
const SplitChallenge = () => null
export default SplitChallenge
`

export const prepareSplitChallenge = (
  challengeFileExisting?: boolean
): void => {
  if (process.env.VERCEL_ENV !== 'production' || challengeFileExisting) return
  try {
    const dir = `${findPagesDir('')}/_split-challenge`
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    writeFileSync(`${dir}/[__key].js`, scriptText)
  } catch (e) {
    console.error(e.message)
    console.log(`> Could not create the necessary file for the split test.
Create the file yourself and set \`challengeFileExisting: true\`.
The code in the file should look like this
// pages/_split-challenge/[__key].js
${scriptText}`)
    process.exit(1)
  }
}
