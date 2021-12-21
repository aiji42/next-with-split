import { middleware } from '../middleware'
import { NextResponse, NextRequest } from 'next/server'

jest.mock('next/server', () => ({
  NextResponse: jest.fn()
}))
const cookieMock = jest.fn()
const headerMock = {
  get: jest.fn()
}
const rewriteMock = jest.fn().mockReturnValue({
  cookie: cookieMock,
  headers: headerMock
})

const runtimeConfig = {
  test1: {
    path: '/foo/*',
    hosts: {
      original: {
        weight: 1,
        host: 'https://branch1.example.com',
        isOriginal: true
      },
      branch2: {
        weight: 1,
        host: 'https://branch2.example.com',
        isOriginal: false
      }
    },
    cookie: {
      path: '/',
      maxAge: 86400000
    }
  }
}

describe('middleware', () => {
  const OLD_ENV = process.env
  beforeEach(() => {
    jest.clearAllMocks()
    process.env = {
      ...OLD_ENV,
      NEXT_WITH_SPLIT_RUNTIME_CONFIG: JSON.stringify(runtimeConfig)
    }
    ;(NextResponse.rewrite as jest.Mock) = rewriteMock
  })
  afterAll(() => {
    process.env = OLD_ENV
  })

  test('preview mode', () => {
    expect(
      middleware({
        cookies: { __prerender_bypass: true }
      } as unknown as NextRequest)
    ).toBeUndefined()
  })

  test('not has runtime config', () => {
    process.env = {
      ...process.env,
      NEXT_WITH_SPLIT_RUNTIME_CONFIG: ''
    }

    expect(
      middleware({
        cookies: {}
      } as unknown as NextRequest)
    ).toBeUndefined()
  })

  test('has runtime config but path is not matched', () => {
    expect(
      middleware({
        cookies: {},
        nextUrl: {
          href: 'https://example.com/bar',
          origin: 'https://example.com'
        }
      } as unknown as NextRequest)
    ).toBeUndefined()
  })

  test('accessed by a bot', () => {
    expect(
      middleware({
        cookies: {},
        nextUrl: {
          href: 'https://example.com/foo/bar',
          origin: 'https://example.com'
        },
        ua: { isBot: true }
      } as unknown as NextRequest)
    ).toBeUndefined()
  })

  test('path is matched and has sticky cookie', () => {
    middleware({
      cookies: { 'x-split-key-test1': 'branch2' },
      nextUrl: {
        href: 'https://example.com/foo/bar',
        origin: 'https://example.com'
      }
    } as unknown as NextRequest)

    expect(NextResponse.rewrite).toBeCalledWith(
      'https://branch2.example.com/foo/bar'
    )
    expect(cookieMock).toBeCalledWith('x-split-key-test1', 'branch2', {
      maxAge: 86400000,
      path: '/'
    })
  })

  test('path is matched and not has sticky cookie', () => {
    jest.spyOn(global.Math, 'random').mockReturnValue(0)

    middleware({
      cookies: {},
      nextUrl: {
        href: 'https://example.com/foo/bar',
        origin: 'https://example.com'
      }
    } as unknown as NextRequest)

    expect(NextResponse.rewrite).toBeCalledWith('/foo/bar')
    expect(cookieMock).toBeCalledWith('x-split-key-test1', 'original', {
      maxAge: 86400000,
      path: '/'
    })
  })

  describe('on preflight', () => {
    describe('from NOT target path', () => {
      test('matched original', () => {
        headerMock.get = jest.fn().mockReturnValue('/foo/bar')

        middleware({
          cookies: {},
          nextUrl: {
            href: 'https://example.com/foo/bar',
            origin: 'https://example.com'
          },
          headers: {
            get: () => 'https://example.com/bar' // referrer
          },
          preflight: 1
        } as unknown as NextRequest)

        expect(NextResponse).not.toBeCalled()
      })

      test('matched challenger', () => {
        headerMock.get = jest
          .fn()
          .mockReturnValue('https://branch2.example.com/foo/bar')

        middleware({
          cookies: {},
          nextUrl: {
            href: 'https://example.com/foo/bar',
            origin: 'https://example.com'
          },
          headers: {
            get: () => 'https://example.com/bar' // referrer
          },
          preflight: 1
        } as unknown as NextRequest)

        expect(NextResponse).toBeCalledWith(null)
      })
    })
    describe('from target path', () => {
      test('matched original', () => {
        headerMock.get = jest.fn().mockReturnValue('/foo/bar')

        middleware({
          cookies: {},
          nextUrl: {
            href: 'https://example.com/foo/bar',
            origin: 'https://example.com'
          },
          headers: {
            get: () => 'https://example.com/foo/baz' // referrer
          },
          preflight: 1
        } as unknown as NextRequest)

        expect(NextResponse).not.toBeCalled()
      })
      test('matched challenger', () => {
        headerMock.get = jest
          .fn()
          .mockReturnValue('https://branch2.example.com/foo/bar')

        middleware({
          cookies: {},
          nextUrl: {
            href: 'https://example.com/foo/bar',
            origin: 'https://example.com'
          },
          headers: {
            get: () => 'https://example.com/foo/baz' // referrer
          },
          preflight: 1
        } as unknown as NextRequest)

        expect(NextResponse).not.toBeCalled()
      })
    })

    test('can not get the referrer', () => {
      headerMock.get = jest
        .fn()
        .mockReturnValue('https://branch2.example.com/foo/bar')

      middleware({
        cookies: {},
        nextUrl: {
          href: 'https://example.com/foo/bar',
          origin: 'https://example.com'
        },
        headers: {
          get: () => undefined // referrer
        },
        preflight: 1
      } as unknown as NextRequest)

      expect(NextResponse).not.toBeCalled()
    })
  })
})
