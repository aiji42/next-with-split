import { makeRewrites } from './make-rewrites'

describe('makeRewrites', () => {
  it('must return inactiveRewiteRule when no challenger', () => {
    return makeRewrites({ main: '' }, 'top', true, undefined)().then((res) => {
      expect(res).toEqual({
        beforeFiles: [{ destination: '/top', source: '/' }]
      })
    })
  })
  it('must return inactiveRewiteRule when active flag is not true', () => {
    return makeRewrites(
      { main: '', challenger: 'https://example.com' },
      'top',
      false,
      undefined
    )().then((res) => {
      expect(res).toEqual({
        beforeFiles: [{ destination: '/top', source: '/' }]
      })
    })
  })
  it('must return activeRewiteRule when has mappings and active flag is true', () => {
    return makeRewrites(
      { main: '', challenger: 'https://example.com' },
      'top',
      true,
      undefined
    )().then((res) => {
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