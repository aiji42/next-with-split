import { withSplit } from '../with-split'
import { prepareSplitChallenge } from '../prepare-split-challenge'

jest.mock('../prepare-split-challenge', () => ({
  prepareSplitChallenge: jest.fn()
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
    process.env = {
      ...process.env,
      VERCEL_URL: 'vercel.example.com',
      VERCEL_ENV: 'production'
    }
    const conf = withSplit({})
    expect(conf.assetPrefix).toEqual('')
    expect(conf.images).toEqual({
      path: undefined
    })
    expect(conf.serverRuntimeConfig).toEqual({ splits: {} })
    return conf.rewrites().then((res) => {
      expect(res).toEqual({
        beforeFiles: []
      })
    })
  })
  it('mut return config merged passed values', () => {
    process.env = {
      ...process.env,
      VERCEL_URL: 'vercel.example.com',
      VERCEL_ENV: 'production'
    }
    const conf = withSplit({
      assetPrefix: 'https://hoge.com',
      images: {
        path: 'https://hoge.com/_next/image'
      },
      serverRuntimeConfig: {
        foo: {
          bar: 'bar'
        }
      }
    })
    expect(conf.assetPrefix).toEqual('https://hoge.com')
    expect(conf.images).toEqual({ path: 'https://hoge.com/_next/image' })
    expect(conf.serverRuntimeConfig).toEqual({
      foo: {
        bar: 'bar'
      },
      splits: {}
    })
  })
  it('return split test config', () => {
    process.env = {
      ...process.env,
      VERCEL_URL: 'vercel.example.com',
      VERCEL_ENV: 'production'
    }
    const conf = withSplit({
      splits: {
        test1: {
          hosts: {
            branch1: 'https://branch1.example.com',
            branch2: 'https://branch2.example.com'
          },
          path: '/foo/:path*'
        }
      }
    })
    expect(conf.serverRuntimeConfig).toEqual({
      splits: {
        test1: {
          branch1: {
            host: 'https://branch1.example.com',
            path: '/foo/:path*',
            cookie: { path: '/', maxAge: 60 * 60 * 24 }
          },
          branch2: {
            host: 'https://branch2.example.com',
            path: '/foo/:path*',
            cookie: { path: '/', maxAge: 60 * 60 * 24 }
          }
        }
      }
    })
    return conf.rewrites().then((res) => {
      expect(res).toEqual({
        beforeFiles: [
          {
            source: '/foo/:path*',
            destination: '/_split-challenge/test1',
            has: [{ type: 'header', key: 'user-agent' }]
          }
        ]
      })
    })
  })
  it('return split test config when challenge file existing', () => {
    process.env = {
      ...process.env,
      VERCEL_URL: 'vercel.example.com',
      VERCEL_ENV: 'production'
    }
    const conf = withSplit({
      splits: {
        test1: {
          hosts: {
            branch1: 'https://branch1.example.com',
            branch2: 'https://branch2.example.com'
          },
          path: '/foo/:path*'
        }
      },
      challengeFileExisting: true
    })
    expect(conf.serverRuntimeConfig).toEqual({
      splits: {
        test1: {
          branch1: {
            host: 'https://branch1.example.com',
            path: '/foo/:path*',
            cookie: { path: '/', maxAge: 60 * 60 * 24 }
          },
          branch2: {
            host: 'https://branch2.example.com',
            path: '/foo/:path*',
            cookie: { path: '/', maxAge: 60 * 60 * 24 }
          }
        }
      }
    })
    expect(prepareSplitChallenge).toBeCalledWith(true, true)
    return conf.rewrites().then((res) => {
      expect(res).toEqual({
        beforeFiles: [
          {
            source: '/foo/:path*',
            destination: '/_split-challenge/test1',
            has: [{ type: 'header', key: 'user-agent' }]
          }
        ]
      })
    })
  })
  it('return empty rewrite rules when runs on not main branch', () => {
    process.env = {
      ...process.env,
      VERCEL_ENV: 'preview',
      VERCEL_URL: 'preview.example.com',
      VERCEL_GIT_COMMIT_REF: 'branch1'
    }
    const conf = withSplit({
      splits: {
        test1: {
          hosts: {
            branch1: 'https://branch1.example.com',
            branch2: 'https://branch2.example.com'
          },
          path: '/foo/:path*'
        }
      }
    })
    expect(process.env.NEXT_PUBLIC_IS_TARGET_SPLIT_TESTING).toEqual('true')
    expect(conf.assetPrefix).toEqual('https://preview.example.com')
    expect(conf.images).toEqual({
      path: 'https://preview.example.com/_next/image'
    })
    expect(conf.serverRuntimeConfig).toEqual({
      splits: {
        test1: {
          branch1: {
            host: 'https://branch1.example.com',
            path: '/foo/:path*',
            cookie: { path: '/', maxAge: 60 * 60 * 24 }
          },
          branch2: {
            host: 'https://branch2.example.com',
            path: '/foo/:path*',
            cookie: { path: '/', maxAge: 60 * 60 * 24 }
          }
        }
      }
    })
    return conf.rewrites().then((res) => {
      expect(res).toEqual({
        beforeFiles: []
      })
    })
  })

  describe('manual config', () => {
    it('prepareSplitChallenge must call with prepared option when manuals.prepared is set true', () => {
      withSplit({
        splits: {
          test1: {
            hosts: {
              branch1: 'https://branch1.example.com',
              branch2: 'https://branch2.example.com'
            },
            path: '/foo/:path*'
          }
        },
        manuals: {
          prepared: true
        }
      })
      expect(prepareSplitChallenge).toBeCalledWith(false, true)
    })

    it('must return rewrite rules manuals.isOriginal is set true', () => {
      const conf = withSplit({
        splits: {
          test1: {
            hosts: {
              branch1: 'https://branch1.example.com',
              branch2: 'https://branch2.example.com'
            },
            path: '/foo/:path*'
          }
        },
        manuals: {
          isOriginal: true
        }
      })
      return conf.rewrites().then((res) => {
        expect(res).toEqual({
          beforeFiles: [
            {
              source: '/foo/:path*',
              destination: '/_split-challenge/test1',
              has: [{ type: 'header', key: 'user-agent' }]
            }
          ]
        })
      })
    })

    it('must return empty rewrite rules when manuals.isOriginal is set false', () => {
      const conf = withSplit({
        splits: {
          test1: {
            hosts: {
              branch1: 'https://branch1.example.com',
              branch2: 'https://branch2.example.com'
            },
            path: '/foo/:path*'
          }
        },
        manuals: {
          isOriginal: false
        }
      })
      return conf.rewrites().then((res) => {
        expect(res).toEqual({ beforeFiles: [] })
      })
    })

    it('Env variable indicate targeting when manuals.currentBranch is set target branch', () => {
      withSplit({
        splits: {
          test1: {
            hosts: {
              branch1: 'https://branch1.example.com',
              branch2: 'https://branch2.example.com'
            },
            path: '/foo/:path*'
          }
        },
        manuals: {
          currentBranch: 'branch1'
        }
      })
      expect(process.env.NEXT_PUBLIC_IS_TARGET_SPLIT_TESTING).toEqual('true')
    })

    it('Env variable must not indicate targeting when manuals.currentBranch is set NOT targeted branch', () => {
      withSplit({
        splits: {
          test1: {
            hosts: {
              branch1: 'https://branch1.example.com',
              branch2: 'https://branch2.example.com'
            },
            path: '/foo/:path*'
          }
        },
        manuals: {
          currentBranch: 'branch3'
        }
      })
      expect(process.env.NEXT_PUBLIC_IS_TARGET_SPLIT_TESTING).toBeUndefined()
    })

    it('must return assetPrefix and image.path when manuals.hostname is set and isOriginal is set false', () => {
      const conf = withSplit({
        splits: {
          test1: {
            hosts: {
              branch1: 'https://branch1.example.com',
              branch2: 'https://branch2.example.com'
            },
            path: '/foo/:path*'
          }
        },
        manuals: {
          hostname: 'preview.example.com',
          isOriginal: false
        }
      })
      expect(conf.assetPrefix).toEqual('https://preview.example.com')
      expect(conf.images).toEqual({
        path: 'https://preview.example.com/_next/image'
      })
    })

    it('must return blank assetPrefix and image.path when manuals.hostname is set and isOriginal is set true', () => {
      const conf = withSplit({
        splits: {
          test1: {
            hosts: {
              branch1: 'https://branch1.example.com',
              branch2: 'https://branch2.example.com'
            },
            path: '/foo/:path*'
          }
        },
        manuals: {
          hostname: 'preview.example.com',
          isOriginal: true
        }
      })
      expect(conf.assetPrefix).toEqual('')
      expect(conf.images).toEqual({ path: undefined })
    })

    it('must through nextConfig without doing anything when SPLIT_DISABLE', () => {
      process.env = { ...process.env, SPLIT_DISABLE: 'true' }
      const conf = withSplit({
        splits: {
          test1: {
            hosts: {
              branch1: 'https://branch1.example.com',
              branch2: 'https://branch2.example.com'
            },
            path: '/foo/:path*'
          }
        },
        manuals: {
          hostname: 'preview.example.com',
          isOriginal: true
        }
      })
      expect(conf).toEqual({})
    })

    it('must return forced rewrite rules when SPLIT_ACTIVE', () => {
      process.env = { ...process.env, SPLIT_ACTIVE: 'true' }
      const conf = withSplit({
        splits: {
          test1: {
            hosts: {
              branch1: 'https://branch1.example.com',
              branch2: 'https://branch2.example.com'
            },
            path: '/foo/:path*'
          }
        },
        manuals: {
          hostname: 'preview.example.com',
          isOriginal: false
        }
      })
      return conf.rewrites().then((res) => {
        expect(res).toEqual({
          beforeFiles: [
            {
              source: '/foo/:path*',
              destination: '/_split-challenge/test1',
              has: [{ type: 'header', key: 'user-agent' }]
            }
          ]
        })
      })
    })
  })
})
