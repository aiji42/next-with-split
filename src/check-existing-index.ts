import { findPageFile } from 'next/dist/server/lib/find-page-file'
import { findPagesDir } from 'next/dist/lib/find-pages-dir'
import { error } from './log'

export const checkExistingIndex = async (): Promise<boolean> => {
  const pagesDir = findPagesDir('')
  const res = await findPageFile(findPagesDir(''), 'index', [
    'mdx',
    'jsx',
    'js',
    'ts',
    'tsx'
  ])

  if (!res) return false
  error(
    `You cannot use ${pagesDir}/${res} when using \`next-with-split\`. Follow the steps below.`
  )
  console.log(
    `1. Rename ${pagesDir}/${res} to for example \`${pagesDir}/root${res.slice(
      res.lastIndexOf('.')
    )}\`.`
  )
  console.log(
    `2. Use the \`rootPage\` property of nextWithSplit. Specify the file name without extension that you renamed in step 1.`
  )
  console.log(`
    withSplit({
      splits: {
        rootPage: 'root', // default value is 'top'
        branchMappings: {...}
      }
    }`)
  return true
}

