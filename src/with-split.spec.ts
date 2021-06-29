import { withSplit } from './with-split'

jest.mock('./check-existing-index', () => ({
  checkExistingIndex: async () => {
    return false
  }
}))

jest.mock('./check-existing-split-challenge', () => ({
  checkExistingSplitChallenge: async () => {
    return true
  }
}))

jest.spyOn(console, 'warn').mockImplementation((mes) => console.log(mes))

describe('withSplit', () => {
  const OLD_ENV = process.env
  beforeEach(() => {
    jest.resetModules()
    process.env = { ...OLD_ENV }
  })
  afterAll(() => {
    process.env = OLD_ENV
  })

  it('default', () => {
    const conf = withSplit({})
    expect(conf.assetPrefix).toEqual('')
    expect(conf.env).toEqual({ SPLIT_TEST_BRANCHES: '["main"]' })
    expect(conf.trailingSlash).toEqual(true)
    return conf.rewrites().then((res) => {
      expect(res).toEqual({
        beforeFiles: [{ destination: '/top', source: '/' }]
      })
    })
  })

  it('set branchMappings however active flag is not true and not Vercel production', () => {
    const conf = withSplit({
      splits: {
        branchMappings: { challenger: 'https://example.com' }
      }
    })
    expect(conf.assetPrefix).toEqual('')
    expect(conf.env).toEqual({ SPLIT_TEST_BRANCHES: '["main","challenger"]' })
    expect(conf.trailingSlash).toEqual(true)
    return conf.rewrites().then((res) => {
      expect(res).toEqual({
        beforeFiles: [{ destination: '/top', source: '/' }]
      })
    })
  })

  it('set branchMappings and active flag is true', () => {
    const conf = withSplit({
      splits: {
        branchMappings: { challenger: 'https://example.com' },
        active: true
      }
    })
    expect(conf.assetPrefix).toEqual('')
    expect(conf.env).toEqual({ SPLIT_TEST_BRANCHES: '["main","challenger"]' })
    expect(conf.trailingSlash).toEqual(true)
    return conf.rewrites().then((res) => {
      expect(res).toEqual({
        beforeFiles: [
          {
            destination: '/top/',
            has: [{ key: 'next-with-split', type: 'cookie', value: 'main' }],
            source: '/'
          },
          {
            destination: '/:path*',
            has: [{ key: 'next-with-split', type: 'cookie', value: 'main' }],
            source: '/:path*/'
          },
          {
            destination: 'https://example.com/top/',
            has: [
              { key: 'next-with-split', type: 'cookie', value: 'challenger' }
            ],
            source: '/'
          },
          {
            destination: 'https://example.com/:path*',
            has: [
              { key: 'next-with-split', type: 'cookie', value: 'challenger' }
            ],
            source: '/:path*/'
          },
          {
            destination: 'https://example.com/:path*',
            has: [
              { key: 'next-with-split', type: 'cookie', value: 'challenger' }
            ],
            source: '/:path*'
          },
          { destination: '/_split-challenge', source: '/:path*/' }
        ]
      })
    })
  })

  it('set branchMappings and runs on Vercel production', () => {
    process.env = {
      ...process.env,
      VERCEL_ENV: 'production'
    }
    const conf = withSplit({
      splits: {
        branchMappings: { challenger: 'https://example.com' }
      }
    })
    expect(conf.assetPrefix).toEqual('')
    expect(conf.env).toEqual({ SPLIT_TEST_BRANCHES: '["main","challenger"]' })
    expect(conf.trailingSlash).toEqual(true)
    return conf.rewrites().then((res) => {
      expect(res).toEqual({
        beforeFiles: [
          {
            destination: '/top/',
            has: [{ key: 'next-with-split', type: 'cookie', value: 'main' }],
            source: '/'
          },
          {
            destination: '/:path*',
            has: [{ key: 'next-with-split', type: 'cookie', value: 'main' }],
            source: '/:path*/'
          },
          {
            destination: 'https://example.com/top/',
            has: [
              { key: 'next-with-split', type: 'cookie', value: 'challenger' }
            ],
            source: '/'
          },
          {
            destination: 'https://example.com/:path*',
            has: [
              { key: 'next-with-split', type: 'cookie', value: 'challenger' }
            ],
            source: '/:path*/'
          },
          {
            destination: 'https://example.com/:path*',
            has: [
              { key: 'next-with-split', type: 'cookie', value: 'challenger' }
            ],
            source: '/:path*'
          },
          { destination: '/_split-challenge', source: '/:path*/' }
        ]
      })
    })
  })

  it('set branchMappings and runs on challenger branch', () => {
    process.env = {
      ...process.env,
      VERCEL_GIT_COMMIT_REF: 'challenger'
    }
    const conf = withSplit({
      splits: {
        branchMappings: { challenger: 'https://example.com' }
      }
    })
    expect(conf.assetPrefix).toEqual('https://example.com')
    expect(conf.env).toEqual({ SPLIT_TEST_BRANCHES: '["main","challenger"]' })
    expect(conf.trailingSlash).toEqual(true)
    return conf.rewrites().then((res) => {
      expect(res).toEqual({
        beforeFiles: [{ destination: '/top', source: '/' }]
      })
    })
  })

  it('must overwrite trailingSlash: true when passed trailingSlash: false', () => {
    const conf = withSplit({ trailingSlash: false })
    expect(conf.trailingSlash).toEqual(true)
  })

  it('must warn when runs on challenger branch and active flag is true', () => {
    process.env = {
      ...process.env,
      VERCEL_GIT_COMMIT_REF: 'challenger'
    }
    const conf = withSplit({
      splits: {
        active: true,
        branchMappings: { challenger: 'https://example.com' }
      }
    })
    return conf.rewrites().then((res) => {
      expect(res).toEqual({
        beforeFiles: [
          {
            destination: '/top/',
            has: [{ key: 'next-with-split', type: 'cookie', value: 'main' }],
            source: '/'
          },
          {
            destination: '/:path*',
            has: [{ key: 'next-with-split', type: 'cookie', value: 'main' }],
            source: '/:path*/'
          },
          {
            destination: 'https://example.com/top/',
            has: [
              { key: 'next-with-split', type: 'cookie', value: 'challenger' }
            ],
            source: '/'
          },
          {
            destination: 'https://example.com/:path*',
            has: [
              { key: 'next-with-split', type: 'cookie', value: 'challenger' }
            ],
            source: '/:path*/'
          },
          {
            destination: 'https://example.com/:path*',
            has: [
              { key: 'next-with-split', type: 'cookie', value: 'challenger' }
            ],
            source: '/:path*'
          },
          { destination: '/_split-challenge', source: '/:path*/' }
        ]
      })
    })
  })
})
