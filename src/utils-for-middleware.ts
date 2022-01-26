import {
  unlinkSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  existsSync
} from 'fs'
import { resolve } from 'app-root-path'

const DOC_LINK =
  'https://github.com/aiji42/next-with-split/tree/main#auto-installremove-middleware-file'
const LIBRARY_NAME = 'next-with-split'

export const installMiddleware = (middlewarePath: string) => {
  validateMiddlewarePath(middlewarePath)
  const path = resolve(middlewarePath)
  if (
    existsSync(path) &&
    !isNextWithSplitMiddleware(readFileSync(path).toString())
  ) {
    throw new Error(`Manually created middleware is present: ${middlewarePath}`)
  }
  console.log('split traffic enabled, installing middleware: ', middlewarePath)
  writeFileSync(path, scriptText)
}

export const removeMiddleware = (middlewarePath: string) => {
  validateMiddlewarePath(middlewarePath)
  const path = resolve(middlewarePath)
  if (existsSync(path)) {
    console.log('split traffic disabled, removing middleware: ', middlewarePath)
    unlinkSync(path)
  }
}

export const exploreUnmanagedMiddlewares = (
  rootDir: string,
  excludes: string[]
) => {
  if (!existsSync(rootDir)) return
  const middlewares = fileList(resolve(rootDir)).filter((path) =>
    path.includes('_middleware')
  )
  const resolvedExcludes = excludes.map(resolve)

  const unmanaged = middlewares.find((m) => {
    return resolvedExcludes.some((e) => e === m)
      ? false
      : readFileSync(m).toString().includes(LIBRARY_NAME)
  })
  if (unmanaged)
    throw new Error(
      `There is middleware that is not managed by ${LIBRARY_NAME}; ${unmanaged}\nSee ${DOC_LINK}`
    )
}

const fileList = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((dirent) =>
    dirent.isFile()
      ? [`${dir}/${dirent.name}`]
      : fileList(`${dir}/${dirent.name}`)
  )

const validateMiddlewarePath = (path: string) => {
  if (!/_middleware\.(js|ts)$/.test(path))
    throw new Error(`Invalid middleware path: ${path}`)
}

const isNextWithSplitMiddleware = (content: string): boolean =>
  content.includes(LIBRARY_NAME)

export const scriptText = `// This file was installed automatically by ${LIBRARY_NAME}.
// Note: Do not update this file manually.
// See ${DOC_LINK}
export { middleware } from "${LIBRARY_NAME}"
`
