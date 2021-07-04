import { makeRewrites } from './make-rewrites'

describe('makeRewrites', () => {
  const OLD_ENV = process.env
  beforeEach(() => {
    jest.resetModules()
    process.env = { ...OLD_ENV }
  })
  afterAll(() => {
    process.env = OLD_ENV
  })

  it('must return a rewrite rule', () => {
    process.env = { ...process.env, VERCEL_ENV: 'production' }
    return makeRewrites(
      {
        foo: {
          path: '/foo/:path*',
          hosts: {
            branch1: 'https://branch1.example.com',
            branch2: 'https://branch2.example.com'
          }
        }
      },
      undefined
    )().then((res) => {
      expect(res).toEqual({
        beforeFiles: [
          { source: '/foo/:path*', destination: '/_split-challenge/foo' }
        ]
      })
    })
  })

  it('must return rewrite rules', () => {
    process.env = { ...process.env, VERCEL_ENV: 'production' }
    return makeRewrites(
      {
        foo: {
          path: '/foo/:path*',
          hosts: {
            branch1: 'https://branch1.example.com',
            branch2: 'https://branch2.example.com'
          }
        },
        bar: {
          path: '/bar/:path*',
          hosts: {
            branch3: 'https://branch3.example.com',
            branch4: 'https://branch4.example.com'
          }
        }
      },
      undefined
    )().then((res) => {
      expect(res).toEqual({
        beforeFiles: [
          { source: '/foo/:path*', destination: '/_split-challenge/foo' },
          {
            source: '/bar/:path*',
            destination: '/_split-challenge/bar'
          }
        ]
      })
    })
  })

  it('must return no rewrite rule when option is empty', () => {
    process.env = { ...process.env, VERCEL_ENV: 'production' }
    return makeRewrites({}, undefined)().then((res) => {
      expect(res).toEqual({
        beforeFiles: []
      })
    })
  })

  it('must return no rewrite rule when runs on not production', () => {
    return makeRewrites({}, undefined)().then((res) => {
      expect(res).toEqual({
        beforeFiles: []
      })
    })
  })

  it('must return merged rewrite rules', () => {
    process.env = { ...process.env, VERCEL_ENV: 'production' }
    return makeRewrites(
      {
        foo: {
          path: '/foo/:path*',
          hosts: {
            branch1: 'https://branch1.example.com',
            branch2: 'https://branch2.example.com'
          }
        }
      },
      async () => [{ source: '/foo/bar/:path*', destination: '/foo/bar' }]
    )().then((res) => {
      expect(res).toEqual({
        beforeFiles: [
          { source: '/foo/:path*', destination: '/_split-challenge/foo' }
        ],
        afterFiles: [
          {
            source: '/foo/bar/:path*',
            destination: '/foo/bar'
          }
        ]
      })
    })
  })
})
