import { join } from 'path'
import {
  exploreUnmanagedMiddlewares,
  installMiddleware,
  removeMiddleware
} from './utils-for-middleware'

export const manageMiddleware = (
  filePaths: string[],
  prefix: string | undefined,
  command: 'install' | 'remove'
) => {
  const joinedFilePaths = filePaths.map((p) => join(prefix ?? '', p))
  joinedFilePaths.forEach((path) => {
    if (command === 'install') installMiddleware(path)
    if (command === 'remove') removeMiddleware(path)
  })

  exploreUnmanagedMiddlewares(
    join(prefix ?? '', 'src', 'pages'),
    command === 'remove' ? [] : joinedFilePaths
  )
  exploreUnmanagedMiddlewares(
    join(prefix ?? '', 'pages'),
    command === 'remove' ? [] : joinedFilePaths
  )
}
