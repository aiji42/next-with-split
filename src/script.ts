#!/usr/bin/env node

import { statSync, unlinkSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const installMiddleware = (pagePath: string) => {
  writeFileSync(
    resolve(__dirname, '../..', pagePath, '_middleware.js'),
    scriptText
  )
}

const removeMiddleware = (pagePath: string) => {
  ;['js', 'ts'].forEach((ext) => {
    const path = resolve(__dirname, '../..', pagePath, `_middleware.${ext}`)
    if (
      statSync(path, {
        throwIfNoEntry: false
      })
    ) {
      unlinkSync(path)
    }
  })
}

const scriptText = `// NOTE: in this location, this file does nothing
// scripts/split.mjs will copy this file to /pages/_middleware.js at
// install/deploy if process.env.NEXT_SPLIT_ACTIVE == 1
export { middleware } from 'next-with-split'
`

const main = () => {
  const command = process.argv[2]
  const pagesPath = process.argv[3]

  switch (command) {
    case 'remove':
      console.info(
        `split traffic disabled, removing middleware from ${pagesPath}`
      )
      removeMiddleware(pagesPath)
      break
    case 'install':
      console.info(
        `split traffic enabled, installing middleware to ${pagesPath}`
      )
      installMiddleware(pagesPath)
      break
  }
}

main()
