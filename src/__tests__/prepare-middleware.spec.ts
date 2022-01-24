import {
  installMiddleware,
  removeMiddleware,
  scriptText
} from '../prepare-middleware'
import { readFileSync, writeFileSync, unlinkSync, statSync } from 'node:fs'
import { resolve } from 'app-root-path'

jest.mock('app-root-path', () => ({
  resolve: jest.fn()
}))

jest.mock('node:fs', () => ({
  statSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  unlinkSync: jest.fn()
}))

describe('prepare-middleware', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    ;(resolve as jest.Mock).mockImplementation((path) => path)
  })
  describe('installMiddleware', () => {
    test('the path is validated', () => {
      expect(() => installMiddleware('foo/_middleware.js')).toThrow(
        Error(`Invalid middleware path: foo/_middleware.js`)
      )
      expect(() => installMiddleware('pages/_middlewares.js')).toThrowError(
        Error(`Invalid middleware path: pages/_middlewares.js`)
      )
    })
    describe('when middleware file is present', () => {
      beforeEach(() => {
        ;(statSync as jest.Mock).mockReturnValue(true)
      })
      test("if it's middleware that cannot be controlled, make an exception", () => {
        const content = 'export const middleware = () => {}'
        ;(readFileSync as jest.Mock).mockReturnValue(content)
        expect(() => installMiddleware('pages/_middleware.js')).toThrow(
          Error('Manually created middleware is present: pages/_middleware.js')
        )
      })
      test('override any middleware that can be controlled', () => {
        const content = 'export { middleware } from "next-with-split"'
        ;(readFileSync as jest.Mock).mockReturnValue(content)
        installMiddleware('pages/_middleware.js')
        expect(writeFileSync).toBeCalledWith('pages/_middleware.js', scriptText)
      })
    })
    describe('when middleware file is NOT present', () => {
      beforeEach(() => {
        ;(statSync as jest.Mock).mockReturnValue(false)
      })
      test('create middleware file', () => {
        installMiddleware('pages/foo/_middleware.js')
        expect(writeFileSync).toBeCalledWith(
          'pages/foo/_middleware.js',
          scriptText
        )
      })
    })
  })

  describe('removeMiddleware', () => {
    test('the path is validated', () => {
      expect(() => removeMiddleware('foo/_middleware.js')).toThrow(
        Error(`Invalid middleware path: foo/_middleware.js`)
      )
      expect(() => removeMiddleware('pages/_middlewares.js')).toThrowError(
        Error(`Invalid middleware path: pages/_middlewares.js`)
      )
    })
    test('remove middleware if it exists', () => {
      ;(statSync as jest.Mock).mockReturnValue(true)
      removeMiddleware('pages/_middleware.js')
      expect(unlinkSync).toBeCalledWith('pages/_middleware.js')
    })
    test('unlinkSync will not be executed if the middleware does not exist', () => {
      ;(statSync as jest.Mock).mockReturnValue(false)
      removeMiddleware('pages/_middleware.js')
      expect(unlinkSync).not.toBeCalled()
    })
  })
})
