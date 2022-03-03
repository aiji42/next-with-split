import { middleware } from '../middleware'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { Headers } from 'next/dist/server/web/spec-compliant/headers'

jest.mock('next/server', () => ({
  NextResponse: jest.fn()
}))

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
URL.prototype.clone = function () {
  return { pathname: '' }
}
const makeRequest = (option: {
  cookies?: Record<string, string | boolean>
  url?: string
  isBot?: boolean
  preflight?: boolean
  headers?: Headers
}) =>
  ({
    cookies: option.cookies ?? {},
    nextUrl: new URL(option.url ?? 'https://example.com/foo/bar'),
    ua: { isBot: option.isBot ?? false },
    preflight: option.preflight ? '1' : null,
    headers: option.headers ?? new Headers()
  } as unknown as NextRequest)

const runtimeConfig = {
  test1: {
    path: '/foo/*',
    hosts: {
      original: {
        weight: 1,
        host: 'https://example.com',
        isOriginal: true
      },
      challenger: {
        weight: 1,
        host: 'https://challenger.example.com',
        isOriginal: false
      }
    },
    cookie: {
      path: '/',
      maxAge: 86400000
    }
  }
}

const cookie = jest.fn()
const OLD_ENV = process.env

describe('middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(NextResponse as unknown as jest.Mock).mockReturnValue({ cookie })
    NextResponse.rewrite = jest.fn().mockReturnValue({
      cookie
    })
  })
  afterAll(() => {
    process.env = OLD_ENV
  })

  describe('has runtime config', () => {
    beforeEach(() => {
      process.env = {
        ...OLD_ENV,
        NEXT_WITH_SPLIT_RUNTIME_CONFIG: JSON.stringify(runtimeConfig)
      }
    })

    test('preview mode', () => {
      expect(
        middleware(makeRequest({ cookies: { __prerender_bypass: true } }))
      ).toBeUndefined()
    })

    test('path is not matched', () => {
      expect(
        middleware(
          makeRequest({
            url: 'https://example.com/bar'
          })
        )
      ).toBeUndefined()
    })

    test('accessed by a bot', () => {
      expect(
        middleware(
          makeRequest({
            isBot: true
          })
        )
      ).toBeUndefined()
    })

    test('path is matched and has sticky cookie', () => {
      middleware(
        makeRequest({
          cookies: { 'x-split-key-test1': 'challenger' }
        })
      )

      expect(NextResponse.rewrite).toBeCalledWith(
        'https://challenger.example.com/foo/bar'
      )
      expect(cookie).toBeCalledWith(
        'x-split-key-test1',
        'challenger',
        runtimeConfig.test1.cookie
      )
    })

    test('path is matched and not has sticky cookie', () => {
      jest.spyOn(global.Math, 'random').mockReturnValue(0)

      middleware(makeRequest({}))

      expect(NextResponse.rewrite).toBeCalledWith({ pathname: '/foo/bar' })
      expect(cookie).toBeCalledWith(
        'x-split-key-test1',
        'original',
        runtimeConfig.test1.cookie
      )
    })

    describe('on preflight', () => {
      describe('from NOT target path', () => {
        test('matched original', () => {
          middleware(
            makeRequest({
              headers: new Headers({ referer: 'https://example.com/top' }),
              cookies: { 'x-split-key-test1': 'original' },
              preflight: true
            })
          )

          expect(NextResponse.rewrite).toBeCalled()
          expect(NextResponse).not.toBeCalled()
          expect(cookie).toBeCalledWith(
            'x-split-key-test1',
            'original',
            runtimeConfig.test1.cookie
          )
        })

        test('matched challenger', () => {
          middleware(
            makeRequest({
              headers: new Headers({ referer: 'https://example.com/top' }),
              cookies: { 'x-split-key-test1': 'challenger' },
              preflight: true
            })
          )

          expect(NextResponse.rewrite).not.toBeCalled()
          expect(NextResponse).toBeCalledWith(null)
          expect(cookie).toBeCalledWith(
            'x-split-key-test1',
            'challenger',
            runtimeConfig.test1.cookie
          )
        })
      })
      describe('from target path', () => {
        test('matched original', () => {
          middleware(
            makeRequest({
              headers: new Headers({ referer: 'https://example.com/foo/bar' }),
              cookies: { 'x-split-key-test1': 'original' },
              preflight: true
            })
          )

          expect(NextResponse.rewrite).toBeCalled()
          expect(NextResponse).not.toBeCalled()
          expect(cookie).toBeCalledWith(
            'x-split-key-test1',
            'original',
            runtimeConfig.test1.cookie
          )
        })
        test('matched challenger', () => {
          middleware(
            makeRequest({
              headers: new Headers({ referer: 'https://example.com/foo/bar' }),
              cookies: { 'x-split-key-test1': 'challenger' },
              preflight: true
            })
          )

          expect(NextResponse.rewrite).toBeCalled()
          expect(NextResponse).not.toBeCalled()
          expect(cookie).toBeCalledWith(
            'x-split-key-test1',
            'challenger',
            runtimeConfig.test1.cookie
          )
        })
      })

      test('can not get the referer', () => {
        middleware(
          makeRequest({
            cookies: { 'x-split-key-test1': 'original' },
            preflight: true
          })
        )

        expect(NextResponse.rewrite).toBeCalled()
        expect(NextResponse).not.toBeCalled()
        expect(cookie).toBeCalledWith(
          'x-split-key-test1',
          'original',
          runtimeConfig.test1.cookie
        )
      })
    })
  })

  test('not has runtime config', () => {
    process.env = {
      ...process.env,
      NEXT_WITH_SPLIT_RUNTIME_CONFIG: ''
    }

    expect(middleware(makeRequest({}))).toBeUndefined()
  })
})
