import { middleware } from '../middleware'
import { NextResponse, NextRequest } from 'next/server'

jest.mock('next/server', () => ({
  NextResponse: {
    rewrite: jest.fn()
  }
}))
const cookieMock = jest.fn()

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
    jest.resetModules()
    process.env = { ...OLD_ENV }
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
    process.env = {
      ...process.env,
      NEXT_WITH_SPLIT_RUNTIME_CONFIG: JSON.stringify(runtimeConfig)
    }

    expect(
      middleware({
        cookies: {},
        nextUrl: {
          href: '/bar'
        }
      } as unknown as NextRequest)
    ).toBeUndefined()
  })

  test('path is matched and has sticky cookie', () => {
    process.env = {
      ...process.env,
      NEXT_WITH_SPLIT_RUNTIME_CONFIG: JSON.stringify(runtimeConfig)
    }
    ;(NextResponse.rewrite as jest.Mock).mockReturnValue({ cookie: cookieMock })

    middleware({
      cookies: { 'x-split-key-test1': 'branch2' },
      nextUrl: {
        href: '/foo/bar'
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
    process.env = {
      ...process.env,
      NEXT_WITH_SPLIT_RUNTIME_CONFIG: JSON.stringify(runtimeConfig)
    }
    ;(NextResponse.rewrite as jest.Mock).mockReturnValue({ cookie: cookieMock })
    jest.spyOn(global.Math, 'random').mockReturnValue(0)

    middleware({
      cookies: {},
      nextUrl: {
        href: '/foo/bar'
      }
    } as unknown as NextRequest)

    expect(NextResponse.rewrite).toBeCalledWith('/foo/bar')
    expect(cookieMock).toBeCalledWith('x-split-key-test1', 'original', {
      maxAge: 86400000,
      path: '/'
    })
  })
})
