import { vi, describe, beforeEach, test, expect } from 'vitest'
import {
  installMiddleware,
  removeMiddleware,
  exploreUnmanagedMiddlewares,
  scriptText
} from '../utils-for-middleware'
import * as Fs from 'fs'
import * as AppRootPath from 'app-root-path'

vi.mock('app-root-path')
vi.mock('fs')

describe('utils-for-middleware', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.spyOn(AppRootPath, 'resolve').mockImplementation((path) => path)
  })
  describe('installMiddleware', () => {
    test('the path is validated', () => {
      expect(() => installMiddleware('pages/_middlewares.js')).toThrowError(
        Error(`Invalid middleware path: pages/_middlewares.js`)
      )
    })
    describe('when middleware file is present', () => {
      beforeEach(() => {
        vi.spyOn(Fs, 'existsSync').mockReturnValue(true)
      })
      test("if it's middleware that cannot be controlled, make an exception", () => {
        const content = 'export const middleware = () => {}'
        vi.spyOn(Fs, 'readFileSync').mockReturnValue(content)
        expect(() => installMiddleware('pages/_middleware.js')).toThrow(
          Error('Manually created middleware is present: pages/_middleware.js')
        )
      })
      test('override any middleware that can be controlled', () => {
        const content = 'export { middleware } from "next-with-split"'
        vi.spyOn(Fs, 'readFileSync').mockReturnValue(content)
        const mock = vi.spyOn(Fs, 'writeFileSync').mockImplementation(() => {})
        installMiddleware('pages/_middleware.js')
        expect(mock).toBeCalledWith('pages/_middleware.js', scriptText)
      })
    })
    describe('when middleware file is NOT present', () => {
      beforeEach(() => {
        vi.spyOn(Fs, 'existsSync').mockReturnValue(false)
      })
      test('create middleware file', () => {
        installMiddleware('pages/foo/_middleware.js')
        const mock = vi.spyOn(Fs, 'writeFileSync').mockImplementation(() => {})
        expect(mock).toBeCalledWith('pages/foo/_middleware.js', scriptText)
      })
    })
  })

  describe('removeMiddleware', () => {
    test('the path is validated', () => {
      expect(() => removeMiddleware('pages/_middlewares.js')).toThrowError(
        Error(`Invalid middleware path: pages/_middlewares.js`)
      )
    })
    test('remove middleware if it exists', () => {
      vi.spyOn(Fs, 'existsSync').mockReturnValue(true)
      removeMiddleware('pages/_middleware.js')
      const mock = vi.spyOn(Fs, 'unlinkSync').mockImplementation(() => {})
      expect(mock).toBeCalledWith('pages/_middleware.js')
    })
    test('unlinkSync will not be executed if the middleware does not exist', () => {
      vi.spyOn(Fs, 'existsSync').mockReturnValue(false)
      const mock = vi.spyOn(Fs, 'unlinkSync').mockImplementation(() => {})
      removeMiddleware('pages/_middleware.js')
      expect(mock).not.toBeCalled()
    })
  })

  describe('exploreUnmanagedMiddlewares', () => {
    beforeEach(() => {
      vi.spyOn(Fs, 'existsSync').mockReturnValue(true)
      vi.spyOn(Fs, 'readdirSync').mockImplementation(((path: string) => {
        if (path === 'apps/dir')
          return [
            { isFile: () => true, name: 'a.js' },
            { isFile: () => true, name: 'b.js' },
            { isFile: () => true, name: '_middleware.ts' }
          ]
        return [
          { isFile: () => true, name: 'a.js' },
          { isFile: () => true, name: '_middleware.js' },
          { isFile: () => false, name: 'dir' }
        ]
      }) as unknown as typeof Fs.readdirSync)
      vi.spyOn(Fs, 'readFileSync').mockImplementation(((path: string) => {
        if (path === 'apps/_middleware.js') return 'export const () => {}'
        return 'export { middleware } from "next-with-split"'
      }) as unknown as typeof Fs.readFileSync)
    })
    test('if the root directory does not exist, skip the process.', () => {
      vi.spyOn(Fs, 'existsSync').mockReturnValue(false)
      expect(() => exploreUnmanagedMiddlewares('apps', [])).not.toThrow()
    })
    test('no error occurs when all middlewares match excludes', () => {
      expect(() =>
        exploreUnmanagedMiddlewares('apps', [
          'apps/_middleware.js',
          'apps/dir/_middleware.ts'
        ])
      ).not.toThrow()
    })
    test('if the middleware not specified in excludes does not use next-with-split, the error will not occur', () => {
      expect(() =>
        exploreUnmanagedMiddlewares('apps', ['apps/dir/_middleware.ts'])
      ).not.toThrow()
    })
    test('if a middleware that is not specified in excludes uses next-with-split, an error will occur', () => {
      expect(() =>
        exploreUnmanagedMiddlewares('apps', ['apps/_middleware.js'])
      ).toThrowError()
    })
  })
})
