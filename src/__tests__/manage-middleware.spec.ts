import { manageMiddleware } from '../manage-middleware'
import * as utils from '../utils-for-middleware'

describe('manage-middleware', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.spyOn(utils, 'installMiddleware').mockImplementation()
    jest.spyOn(utils, 'removeMiddleware').mockImplementation()
    jest.spyOn(utils, 'exploreUnmanagedMiddlewares').mockImplementation()
  })
  test('install', () => {
    jest.spyOn(utils, 'installMiddleware').mockImplementation()
    jest.spyOn(utils, 'exploreUnmanagedMiddlewares').mockImplementation()
    manageMiddleware(['page/_middleware.js'], 'apps/foo', 'install')
    expect(utils.installMiddleware).toBeCalledWith(
      'apps/foo/page/_middleware.js'
    )
    expect(utils.exploreUnmanagedMiddlewares).toBeCalledWith(
      'apps/foo/src/pages',
      ['apps/foo/page/_middleware.js']
    )
    expect(utils.exploreUnmanagedMiddlewares).toBeCalledWith('apps/foo/pages', [
      'apps/foo/page/_middleware.js'
    ])
  })
  test('remove', () => {
    manageMiddleware(['page/_middleware.js'], undefined, 'remove')
    expect(utils.removeMiddleware).toBeCalledWith('page/_middleware.js')
    expect(utils.exploreUnmanagedMiddlewares).toBeCalledWith('src/pages', [])
    expect(utils.exploreUnmanagedMiddlewares).toBeCalledWith('pages', [])
  })
})
