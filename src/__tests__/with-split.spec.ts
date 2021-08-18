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

  it('default', async () => {
    process.env = {
      ...process.env,
      VERCEL_URL: 'vercel.example.com',
      VERCEL_ENV: 'production'
    }
    const conf = withSplit({})({})
    expect(conf.assetPrefix).toEqual('')
    expect(conf.images).toEqual({
      path: undefined
    })
    expect(conf.serverRuntimeConfig).toEqual({ splits: {} })
    await conf.rewrites?.().then((res) => {
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
    const conf = withSplit({})({
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
  it('return split test config', async () => {
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
    })({})
    expect(conf.serverRuntimeConfig).toEqual({
      splits: {
        test1: {
          branch1: {
            host: 'https://branch1.example.com',
            path: '/foo/:path*',
            cookie: { path: '/', maxAge: 60 * 60 * 24 },
            isOriginal: false,
            weight: 1
          },
          branch2: {
            host: 'https://branch2.example.com',
            path: '/foo/:path*',
            cookie: { path: '/', maxAge: 60 * 60 * 24 },
            isOriginal: false,
            weight: 1
          }
        }
      }
    })
    await conf.rewrites?.().then((res) => {
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
  it('must return config with the biases when passed the biases', () => {
    process.env = {
      ...process.env,
      VERCEL_URL: 'vercel.example.com',
      VERCEL_ENV: 'production'
    }
    const conf = withSplit({
      splits: {
        test1: {
          hosts: {
            branch1: { host: 'https://branch1.example.com', weight: 10 },
            branch2: 'https://branch2.example.com'
          },
          path: '/foo/:path*'
        }
      }
    })({})
    expect(conf.serverRuntimeConfig).toEqual({
      splits: {
        test1: {
          branch1: {
            host: 'https://branch1.example.com',
            path: '/foo/:path*',
            cookie: { path: '/', maxAge: 60 * 60 * 24 },
            isOriginal: false,
            weight: 10
          },
          branch2: {
            host: 'https://branch2.example.com',
            path: '/foo/:path*',
            cookie: { path: '/', maxAge: 60 * 60 * 24 },
            isOriginal: false,
            weight: 1
          }
        }
      }
    })
  })
  it('return split test config with isOriginal === true when branch name is original | main | master', () => {
    process.env = {
      ...process.env,
      VERCEL_URL: 'vercel.example.com',
      VERCEL_ENV: 'production'
    }
    const conf1 = withSplit({
      splits: {
        test1: {
          hosts: {
            branch1: 'https://branch1.example.com',
            original: 'https://original.example.com'
          },
          path: '/foo/:path*'
        }
      }
    })({})
    expect(conf1.serverRuntimeConfig.splits.test1.branch1.isOriginal).toEqual(
      false
    )
    expect(conf1.serverRuntimeConfig.splits.test1.original.isOriginal).toEqual(
      true
    )
    const conf2 = withSplit({
      splits: {
        test1: {
          hosts: {
            branch1: 'https://branch1.example.com',
            main: 'https://original.example.com'
          },
          path: '/foo/:path*'
        }
      }
    })({})
    expect(conf2.serverRuntimeConfig.splits.test1.branch1.isOriginal).toEqual(
      false
    )
    expect(conf2.serverRuntimeConfig.splits.test1.main.isOriginal).toEqual(true)
    const conf3 = withSplit({
      splits: {
        test1: {
          hosts: {
            branch1: 'https://branch1.example.com',
            master: 'https://original.example.com'
          },
          path: '/foo/:path*'
        }
      }
    })({})
    expect(conf3.serverRuntimeConfig.splits.test1.branch1.isOriginal).toEqual(
      false
    )
    expect(conf3.serverRuntimeConfig.splits.test1.master.isOriginal).toEqual(
      true
    )
  })
  it('return empty rewrite rules when runs on not main branch', async () => {
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
    })({})
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
            cookie: { path: '/', maxAge: 60 * 60 * 24 },
            isOriginal: false,
            weight: 1
          },
          branch2: {
            host: 'https://branch2.example.com',
            path: '/foo/:path*',
            cookie: { path: '/', maxAge: 60 * 60 * 24 },
            isOriginal: false,
            weight: 1
          }
        }
      }
    })
    await conf.rewrites?.().then((res) => {
      expect(res).toEqual({
        beforeFiles: []
      })
    })
  })

  describe('manual config', () => {
    it('prepareSplitChallenge must call with prepared option when prepared is set true', () => {
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
        prepared: true
      })({})
      expect(prepareSplitChallenge).toBeCalledWith(false, true)
    })

    it('must return rewrite rules isOriginal is set true', async () => {
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
        isOriginal: true
      })({})
      await conf.rewrites?.().then((res) => {
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

    it('must return empty rewrite rules when isOriginal is set false', async () => {
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
        isOriginal: false
      })({})
      await conf.rewrites?.().then((res) => {
        expect(res).toEqual({ beforeFiles: [] })
      })
    })

    it('Env variable indicate targeting when currentBranch is set target branch', () => {
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
        currentBranch: 'branch1'
      })({})
      expect(process.env.NEXT_PUBLIC_IS_TARGET_SPLIT_TESTING).toEqual('true')
    })

    it('Env variable must not indicate targeting when currentBranch is set NOT targeted branch', () => {
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
        currentBranch: 'branch3'
      })({})
      expect(process.env.NEXT_PUBLIC_IS_TARGET_SPLIT_TESTING).toBeUndefined()
    })

    it('must return assetPrefix and image.path when hostname is set and isOriginal is set false', () => {
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
        hostname: 'preview.example.com',
        isOriginal: false
      })({})
      expect(conf.assetPrefix).toEqual('https://preview.example.com')
      expect(conf.images).toEqual({
        path: 'https://preview.example.com/_next/image'
      })
    })

    it('must return blank assetPrefix and image.path when hostname is set and isOriginal is set true', () => {
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
        hostname: 'preview.example.com',
        isOriginal: true
      })({})
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
        hostname: 'preview.example.com',
        isOriginal: true
      })({})
      expect(conf).toEqual({})
    })

    it('must return forced rewrite rules when SPLIT_ACTIVE', async () => {
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
        hostname: 'preview.example.com',
        isOriginal: false
      })({})
      await conf.rewrites?.().then((res) => {
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

    describe('using the Spectrum', () => {
      it('must reads the environment variables (SPLIT_CONFIG_BY_SPECTRUM) and returns config', () => {
        process.env = {
          ...process.env,
          VERCEL_URL: 'vercel.example.com',
          VERCEL_ENV: 'production',
          SPLIT_CONFIG_BY_SPECTRUM: JSON.stringify({
            test1: {
              path: '/foo/bar',
              hosts: {
                original: { host: 'vercel.example.com', weight: 1 },
                challenger: { host: 'challenger.vercel.example.com', weight: 1 }
              },
              cookie: { maxAge: 60 }
            }
          })
        }

        const conf = withSplit({})({})
        expect(conf.serverRuntimeConfig).toEqual({
          splits: {
            test1: {
              original: {
                host: 'vercel.example.com',
                path: '/foo/bar',
                cookie: { path: '/', maxAge: 60 },
                isOriginal: true,
                weight: 1
              },
              challenger: {
                host: 'challenger.vercel.example.com',
                path: '/foo/bar',
                cookie: { path: '/', maxAge: 60 },
                isOriginal: false,
                weight: 1
              }
            }
          }
        })
      })
    })
  })
})
