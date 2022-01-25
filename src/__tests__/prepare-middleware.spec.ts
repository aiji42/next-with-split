import {
  installMiddleware,
  removeMiddleware,
  scriptText
} from '../prepare-middleware'
import * as Fs from 'node:fs'
import * as AppRootPath from 'app-root-path'

jest.mock('app-root-path')
jest.mock('node:fs')

describe('prepare-middleware', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.spyOn(AppRootPath, 'resolve').mockImplementation((path) => path)
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
        jest.spyOn(Fs, 'statSync').mockReturnValue(true as unknown as Fs.Stats)
      })
      test("if it's middleware that cannot be controlled, make an exception", () => {
        const content = 'export const middleware = () => {}'
        jest.spyOn(Fs, 'readFileSync').mockReturnValue(content)
        expect(() => installMiddleware('pages/_middleware.js')).toThrow(
          Error('Manually created middleware is present: pages/_middleware.js')
        )
      })
      test('override any middleware that can be controlled', () => {
        const content = 'export { middleware } from "next-with-split"'
        jest.spyOn(Fs, 'readFileSync').mockReturnValue(content)
        const mock = jest.spyOn(Fs, 'writeFileSync').mockImplementation()
        installMiddleware('pages/_middleware.js')
        expect(mock).toBeCalledWith('pages/_middleware.js', scriptText)
      })
    })
    describe('when middleware file is NOT present', () => {
      beforeEach(() => {
        jest
          .spyOn(Fs, 'statSync')
          .mockReturnValue(undefined as unknown as Fs.Stats)
      })
      test('create middleware file', () => {
        installMiddleware('pages/foo/_middleware.js')
        const mock = jest.spyOn(Fs, 'writeFileSync').mockImplementation()
        expect(mock).toBeCalledWith('pages/foo/_middleware.js', scriptText)
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
      jest.spyOn(Fs, 'statSync').mockReturnValue(true as unknown as Fs.Stats)
      removeMiddleware('pages/_middleware.js')
      const mock = jest.spyOn(Fs, 'unlinkSync').mockImplementation()
      expect(mock).toBeCalledWith('pages/_middleware.js')
    })
    test('unlinkSync will not be executed if the middleware does not exist', () => {
      jest
        .spyOn(Fs, 'statSync')
        .mockReturnValue(undefined as unknown as Fs.Stats)
      const mock = jest.spyOn(Fs, 'unlinkSync').mockImplementation()
      removeMiddleware('pages/_middleware.js')
      expect(mock).not.toBeCalled()
    })
  })
})
