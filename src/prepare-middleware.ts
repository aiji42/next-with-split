import { statSync, unlinkSync, writeFileSync, readFileSync } from 'node:fs'
import { resolve } from 'app-root-path'

export const installMiddleware = (middlewarePath: string) => {
  validateMiddlewarePath(middlewarePath)
  const path = resolve(middlewarePath)
  if (
    statSync(path, {
      throwIfNoEntry: false
    }) &&
    !/export.+middleware.+from.+next-with-split/.test(
      readFileSync(path).toString()
    )
  ) {
    throw new Error(`Manually created middleware is present: ${middlewarePath}`)
  }
  console.log('split traffic enabled, installing middleware: ', middlewarePath)
  writeFileSync(path, scriptText)
}

export const removeMiddleware = (middlewarePath: string) => {
  validateMiddlewarePath(middlewarePath)
  const path = resolve(middlewarePath)
  if (
    statSync(path, {
      throwIfNoEntry: false
    })
  ) {
    console.log('split traffic disabled, removing middleware: ', middlewarePath)
    unlinkSync(path)
  }
}

const validateMiddlewarePath = (path: string) => {
  if (!/pages\/.*_middleware\.(js|ts)$/.test(path))
    throw new Error(`Invalid middleware path: ${path}`)
}

// TODO: add README link
export const scriptText = `// This file was installed automatically by the with-next-split command.
// Note: Do not update this file manually.
export { middleware } from 'next-with-split'
`
