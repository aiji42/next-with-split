import { vi, describe, beforeEach, afterAll, it, expect, test } from 'vitest'
import { withSplit } from '../with-split'
import { NextConfig } from 'next'

describe('withSplit', () => {
  const OLD_ENV = process.env
  beforeEach(() => {
    vi.resetAllMocks()
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
    const conf = withSplit({})({})
    expect(conf.assetPrefix).toEqual('')
    expect(conf.images).toEqual({
      path: undefined
    })
    expect(conf.env).toEqual({ NEXT_WITH_SPLIT_RUNTIME_CONFIG: '{}' })
  })
  it('must return config merged passed values', () => {
    process.env = {
      ...process.env,
      VERCEL_URL: 'vercel.example.com',
      VERCEL_ENV: 'production'
    }
    const conf = withSplit({})({
      assetPrefix: 'https://hoge.com',
      images: {
        path: 'https://hoge.com/_next/image'
      } as NextConfig['images'],
      env: {
        foo: 'bar'
      }
    })
    expect(conf.assetPrefix).toEqual('https://hoge.com')
    expect(conf.images).toEqual({ path: 'https://hoge.com/_next/image' })
    expect(conf.env).toEqual({
      foo: 'bar',
      NEXT_WITH_SPLIT_RUNTIME_CONFIG: '{}'
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
          path: '/foo/*'
        }
      }
    })({})
    expect(conf.env).toEqual({
      NEXT_WITH_SPLIT_RUNTIME_CONFIG:
        '{"test1":{"path":"/foo/*","hosts":{"branch1":{"weight":1,"host":"https://branch1.example.com","isOriginal":false},"branch2":{"weight":1,"host":"https://branch2.example.com","isOriginal":false}},"cookie":{"path":"/","maxAge":86400000}}}'
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
          path: '/foo/*'
        }
      }
    })({})
    expect(conf.env).toEqual({
      NEXT_WITH_SPLIT_RUNTIME_CONFIG:
        '{"test1":{"path":"/foo/*","hosts":{"branch1":{"host":"https://branch1.example.com","weight":10,"isOriginal":false},"branch2":{"weight":1,"host":"https://branch2.example.com","isOriginal":false}},"cookie":{"path":"/","maxAge":86400000}}}'
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
          path: '/foo/*'
        }
      }
    })({})
    expect(conf1.env).toEqual({
      NEXT_WITH_SPLIT_RUNTIME_CONFIG:
        '{"test1":{"path":"/foo/*","hosts":{"branch1":{"weight":1,"host":"https://branch1.example.com","isOriginal":false},"original":{"weight":1,"host":"https://original.example.com","isOriginal":true}},"cookie":{"path":"/","maxAge":86400000}}}'
    })
    const conf2 = withSplit({
      splits: {
        test1: {
          hosts: {
            branch1: 'https://branch1.example.com',
            main: 'https://original.example.com'
          },
          path: '/foo/*'
        }
      }
    })({})
    expect(conf2.env).toEqual({
      NEXT_WITH_SPLIT_RUNTIME_CONFIG:
        '{"test1":{"path":"/foo/*","hosts":{"branch1":{"weight":1,"host":"https://branch1.example.com","isOriginal":false},"main":{"weight":1,"host":"https://original.example.com","isOriginal":true}},"cookie":{"path":"/","maxAge":86400000}}}'
    })
    const conf3 = withSplit({
      splits: {
        test1: {
          hosts: {
            branch1: 'https://branch1.example.com',
            master: 'https://original.example.com'
          },
          path: '/foo/*'
        }
      }
    })({})
    expect(conf3.env).toEqual({
      NEXT_WITH_SPLIT_RUNTIME_CONFIG:
        '{"test1":{"path":"/foo/*","hosts":{"branch1":{"weight":1,"host":"https://branch1.example.com","isOriginal":false},"master":{"weight":1,"host":"https://original.example.com","isOriginal":true}},"cookie":{"path":"/","maxAge":86400000}}}'
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
          path: '/foo/*'
        }
      }
    })({})
    expect(process.env.NEXT_PUBLIC_IS_TARGET_SPLIT_TESTING).toEqual('true')
    expect(conf.assetPrefix).toEqual('https://preview.example.com')
    expect(conf.images).toEqual({
      path: 'https://preview.example.com/_next/image'
    })
    expect(conf.env).toEqual({})
  })

  describe('manual config', () => {
    it('must return empty runtime config when isOriginal is set false', () => {
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
            path: '/foo/*'
          }
        },
        isOriginal: false
      })({})
      expect(conf.env).toEqual({})
    })

    it('Env variable indicate targeting when currentBranch is set target branch', () => {
      withSplit({
        splits: {
          test1: {
            hosts: {
              branch1: 'https://branch1.example.com',
              branch2: 'https://branch2.example.com'
            },
            path: '/foo/*'
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
            path: '/foo/*'
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
            path: '/foo/*'
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
            path: '/foo/*'
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
            path: '/foo/*'
          }
        },
        hostname: 'preview.example.com',
        isOriginal: true
      })({})
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
            path: '/foo/*'
          }
        },
        hostname: 'preview.example.com',
        isOriginal: false
      })({})
      expect(conf.env).toEqual({
        NEXT_WITH_SPLIT_RUNTIME_CONFIG:
          '{"test1":{"path":"/foo/*","hosts":{"branch1":{"weight":1,"host":"https://branch1.example.com","isOriginal":false},"branch2":{"weight":1,"host":"https://branch2.example.com","isOriginal":false}},"cookie":{"path":"/","maxAge":86400000}}}'
      })
    })

    test('hosts with no protocol must be complemented', () => {
      process.env = {
        ...process.env,
        VERCEL_URL: 'vercel.example.com',
        VERCEL_ENV: 'production'
      }
      const conf = withSplit({
        splits: {
          test1: {
            hosts: {
              branch1: 'branch1.example.com',
              branch2: 'branch2.example.com'
            },
            path: '/foo/*'
          }
        }
      })({})
      expect(conf.env).toEqual({
        NEXT_WITH_SPLIT_RUNTIME_CONFIG:
          '{"test1":{"path":"/foo/*","hosts":{"branch1":{"weight":1,"host":"https://branch1.example.com","isOriginal":false},"branch2":{"weight":1,"host":"https://branch2.example.com","isOriginal":false}},"cookie":{"path":"/","maxAge":86400000}}}'
      })
    })

    test('if the host format is wrong, an error occurs', () => {
      process.env = {
        ...process.env,
        VERCEL_URL: 'vercel.example.com',
        VERCEL_ENV: 'production'
      }
      expect(() =>
        withSplit({
          splits: {
            test1: {
              hosts: {
                branch1: '//:branch1.example.com',
                branch2: 'branch2.example.com'
              },
              path: '/foo/*'
            }
          }
        })({})
      ).toThrow('Incorrect host format: //:branch1.example.com')
    })

    test('if the host is set with a path, an error occurs', () => {
      process.env = {
        ...process.env,
        VERCEL_URL: 'vercel.example.com',
        VERCEL_ENV: 'production'
      }
      expect(() =>
        withSplit({
          splits: {
            test1: {
              hosts: {
                branch1: 'https//:branch1.example.com/',
                branch2: 'branch2.example.com/'
              },
              path: '/foo/*'
            }
          }
        })({})
      ).toThrow(
        "Incorrect host format: Specify only the protocol and domain (you set 'https//:branch1.example.com/')"
      )
    })

    test('if the path is not set, an error occurs', () => {
      process.env = {
        ...process.env,
        VERCEL_URL: 'vercel.example.com',
        VERCEL_ENV: 'production'
      }
      expect(() =>
        withSplit({
          splits: {
            test1: {
              hosts: {
                branch1: 'https//:branch1.example.com',
                branch2: 'branch2.example.com'
              },
              path: ''
            }
          }
        })({})
      ).toThrow('Invalid format: The `path` is not set on `test1`.')
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
        expect(conf.env).toEqual({
          NEXT_WITH_SPLIT_RUNTIME_CONFIG:
            '{"test1":{"path":"/foo/bar","hosts":{"original":{"host":"https://vercel.example.com","weight":1,"isOriginal":true},"challenger":{"host":"https://challenger.vercel.example.com","weight":1,"isOriginal":false}},"cookie":{"path":"/","maxAge":60}}}'
        })
      })
    })
  })
})
