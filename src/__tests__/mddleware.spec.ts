/**
 * @vitest-environment edge-runtime
 */
import { vi, describe, beforeEach, afterAll, test, expect, Mock } from 'vitest'
import { middleware } from '../middleware'
const { NextRequest } = require('next/server')
import { NextResponse, userAgent } from 'next/server'
import { random } from '../random'

vi.mock('next/server', () => ({
  NextResponse: vi.fn(),
  userAgent: vi.fn()
}))
vi.mock('../random', () => ({
  random: vi.fn()
}))

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

const cookies = {
  set: vi.fn()
}
const OLD_ENV = process.env

beforeEach(() => {
  vi.resetAllMocks()
  ;(userAgent as Mock).mockReturnValue({ isBot: false })
  process.env = {
    ...OLD_ENV,
    NEXT_WITH_SPLIT_RUNTIME_CONFIG: JSON.stringify(runtimeConfig)
  }
})

afterAll(() => {
  process.env = OLD_ENV
})

describe('middleware', () => {
  describe('has runtime config', () => {
    test('preview mode', () => {
      const req = new NextRequest('https://example.com/foo/bar', {})
      req.cookies.set('__prerender_bypass', true)
      expect(middleware(req)).toBeUndefined()
    })

    test('path is not matched', () => {
      const req = new NextRequest('https://example.com/bar', {})
      expect(middleware(req)).toBeUndefined()
    })

    test('accessed by a bot', () => {
      const req = new NextRequest('https://example.com/foo/bar', {})
      ;(userAgent as Mock).mockReturnValue({ isBot: true })
      expect(middleware(req)).toBeUndefined()
    })

    test('path is matched and has sticky cookie', () => {
      NextResponse.rewrite = vi.fn().mockReturnValueOnce({ cookies })
      const req = new NextRequest('https://example.com/foo/bar', {})
      req.cookies.set('x-split-key-test1', 'challenger')
      middleware(req)

      expect(NextResponse.rewrite).toBeCalledWith(
        'https://challenger.example.com/foo/bar'
      )
      expect(cookies.set).toBeCalledWith(
        'x-split-key-test1',
        'challenger',
        runtimeConfig.test1.cookie
      )
    })

    test('path is matched and not has sticky cookie', () => {
      ;(random as Mock).mockReturnValueOnce(1)
      NextResponse.rewrite = vi.fn().mockReturnValueOnce({ cookies })
      const req = new NextRequest('https://example.com/foo/bar', {})
      middleware(req)

      expect(NextResponse.rewrite).toBeCalled()
      expect(cookies.set).toBeCalledWith(
        'x-split-key-test1',
        'challenger',
        runtimeConfig.test1.cookie
      )
    })

    describe('on preflight', () => {
      beforeEach(() => {
        ;(userAgent as Mock).mockReturnValueOnce({ isBot: false })
      })
      describe('from NOT target path', () => {
        test('matched original', () => {
          NextResponse.next = vi.fn().mockReturnValueOnce({ cookies })
          const req = new NextRequest('https://example.com/foo/bar', {
            method: 'OPTIONS',
            headers: {
              referrer: 'https://example.com/top'
            }
          })
          req.cookies.set('x-split-key-test1', 'original')
          middleware(req)

          expect(NextResponse.next).toBeCalled()
          expect(cookies.set).toBeCalledWith(
            'x-split-key-test1',
            'original',
            runtimeConfig.test1.cookie
          )
        })

        test('matched challenger', () => {
          // @ts-ignore
          NextResponse = vi.fn().mockReturnValueOnce({ cookies })
          const req = new NextRequest('https://example.com/foo/bar', {
            method: 'OPTIONS',
            headers: {
              referrer: 'https://example.com/top'
            }
          })
          req.cookies.set('x-split-key-test1', 'challenger')
          middleware(req)

          expect(NextResponse).toBeCalledWith(null)
          expect(cookies.set).toBeCalledWith(
            'x-split-key-test1',
            'challenger',
            runtimeConfig.test1.cookie
          )
        })
      })

      describe('from target path', () => {
        test('matched original', () => {
          NextResponse.next = vi.fn().mockReturnValueOnce({ cookies })
          const req = new NextRequest('https://example.com/foo/bar', {
            method: 'OPTIONS',
            headers: {
              referer: 'https://example.com/foo/bar'
            }
          })
          req.cookies.set('x-split-key-test1', 'original')

          middleware(req)

          expect(NextResponse.next).toBeCalled()
          expect(cookies.set).toBeCalledWith(
            'x-split-key-test1',
            'original',
            runtimeConfig.test1.cookie
          )
        })

        test('matched challenger', () => {
          NextResponse.rewrite = vi.fn().mockReturnValueOnce({ cookies })
          const req = new NextRequest('https://example.com/foo/bar', {
            method: 'OPTIONS',
            headers: {
              referer: 'https://example.com/foo/bar'
            }
          })
          req.cookies.set('x-split-key-test1', 'challenger')
          middleware(req)

          expect(NextResponse.rewrite).toBeCalledWith(
            'https://challenger.example.com/foo/bar'
          )
          expect(cookies.set).toBeCalledWith(
            'x-split-key-test1',
            'challenger',
            runtimeConfig.test1.cookie
          )
        })
      })

      test('can not get the referer', () => {
        NextResponse.next = vi.fn().mockReturnValueOnce({ cookies })
        const req = new NextRequest('https://example.com/foo/bar', {
          method: 'OPTIONS'
        })
        req.cookies.set('x-split-key-test1', 'original')

        middleware(req)

        expect(NextResponse.next).toBeCalled()
        expect(cookies.set).toBeCalledWith(
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
    const req = new NextRequest('https://example.com/foo/bar', {})

    expect(middleware(req)).toBeUndefined()
  })
})
