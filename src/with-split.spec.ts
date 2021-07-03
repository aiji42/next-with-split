import { withSplit } from './with-split'

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
    process.env = { ...process.env, VERCEL_URL: 'vercel.example.com', VERCEL_ENV: 'production' }
    const conf = withSplit({})
    expect(conf.assetPrefix).toEqual('https://vercel.example.com')
    expect(conf.images).toEqual({ path: 'https://vercel.example.com/_next/image' })
    expect(conf.serverRuntimeConfig).toEqual({ splits: {} })
    return conf.rewrites().then((res) => {
      expect(res).toEqual({
        beforeFiles: []
      })
    })
  })
})
