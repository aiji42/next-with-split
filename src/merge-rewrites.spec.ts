import { RouteHas } from 'next/dist/lib/load-custom-routes'
import { mergeRewrites } from './merge-rewrites'

const inactiveRewrite = {
  beforeFiles: [{ destination: '/top', source: '/' }]
}

const activeRewrite = {
  beforeFiles: [
    {
      destination: '/top/',
      has: <RouteHas[]>[
        { key: 'next-with-split', type: 'cookie', value: 'main' }
      ],
      source: '/'
    },
    {
      destination: 'https://example.com/:path*',
      has: <RouteHas[]>[
        { key: 'next-with-split', type: 'cookie', value: 'challenger' }
      ],
      source: '/:path*'
    },
    { destination: '/_split-challenge', source: '/:path*/' }
  ]
}

describe('mergeRewrites', () => {
  describe('originalRewrite is undefind', () => {
    it('must return untouched rewrite', () => {
      expect(mergeRewrites(undefined, inactiveRewrite)).toEqual(inactiveRewrite)
      expect(mergeRewrites(undefined, activeRewrite)).toEqual(activeRewrite)
    })
  })

  describe('originalRewrite is array type rewrite', () => {
    it('must return inserted beforeFiles when inactive', () => {
      expect(
        mergeRewrites(
          [
            {
              destination: '/foo/',
              source: '/bar',
              has: [{ key: 'baz', type: 'cookie', value: 'qux' }]
            }
          ],
          inactiveRewrite
        )
      ).toEqual({
        beforeFiles: [
          { destination: '/top', source: '/' },
          {
            destination: '/foo/',
            source: '/bar',
            has: [{ key: 'baz', type: 'cookie', value: 'qux' }]
          }
        ]
      })

      expect(
        mergeRewrites(
          [
            {
              destination: '/foo/',
              source: '/bar'
            }
          ],
          inactiveRewrite
        )
      ).toEqual({
        beforeFiles: [
          { destination: '/top', source: '/' },
          {
            destination: '/foo/',
            source: '/bar'
          }
        ]
      })
    })

    it('must return inserted beforeFiles before challenge-split with has cookie condition when active', () => {
      expect(
        mergeRewrites(
          [
            {
              destination: '/foo/',
              source: '/bar',
              has: [{ key: 'baz', type: 'cookie', value: 'qux' }]
            }
          ],
          activeRewrite
        )
      ).toEqual({
        beforeFiles: [
          {
            destination: '/top/',
            has: [{ key: 'next-with-split', type: 'cookie', value: 'main' }],
            source: '/'
          },
          {
            destination: 'https://example.com/:path*',
            has: [
              { key: 'next-with-split', type: 'cookie', value: 'challenger' }
            ],
            source: '/:path*'
          },
          {
            destination: '/foo/',
            source: '/bar',
            has: [
              { key: 'next-with-split', type: 'cookie', value: 'main' },
              { key: 'baz', type: 'cookie', value: 'qux' }
            ]
          },
          { destination: '/_split-challenge', source: '/:path*/' }
        ]
      })

      expect(
        mergeRewrites(
          [
            {
              destination: '/foo/',
              source: '/bar'
            }
          ],
          activeRewrite
        )
      ).toEqual({
        beforeFiles: [
          {
            destination: '/top/',
            has: [{ key: 'next-with-split', type: 'cookie', value: 'main' }],
            source: '/'
          },
          {
            destination: 'https://example.com/:path*',
            has: [
              { key: 'next-with-split', type: 'cookie', value: 'challenger' }
            ],
            source: '/:path*'
          },
          {
            destination: '/foo/',
            source: '/bar',
            has: [{ key: 'next-with-split', type: 'cookie', value: 'main' }]
          },
          { destination: '/_split-challenge', source: '/:path*/' }
        ]
      })
    })
  })

  describe('originalRewrite is object type rewrite', () => {
    it('must return inserted beforeFiles when inactive', () => {
      expect(
        mergeRewrites(
          {
            beforeFiles: [
              {
                destination: '/foo/',
                source: '/bar',
                has: [{ key: 'baz', type: 'cookie', value: 'qux' }]
              }
            ]
          },
          inactiveRewrite
        )
      ).toEqual({
        beforeFiles: [
          { destination: '/top', source: '/' },
          {
            destination: '/foo/',
            source: '/bar',
            has: [{ key: 'baz', type: 'cookie', value: 'qux' }]
          }
        ]
      })

      expect(
        mergeRewrites(
          {
            afterFiles: [
              {
                destination: '/foo/',
                source: '/bar',
                has: [{ key: 'baz', type: 'cookie', value: 'qux' }]
              }
            ]
          },
          inactiveRewrite
        )
      ).toEqual({
        beforeFiles: [{ destination: '/top', source: '/' }],
        afterFiles: [
          {
            destination: '/foo/',
            source: '/bar',
            has: [{ key: 'baz', type: 'cookie', value: 'qux' }]
          }
        ]
      })
    })

    it('must return inserted beforeFiles before challenge-split with has cookie condition when active', () => {
      expect(
        mergeRewrites(
          {
            beforeFiles: [
              {
                destination: '/foo/',
                source: '/bar',
                has: [{ key: 'baz', type: 'cookie', value: 'qux' }]
              }
            ]
          },
          activeRewrite
        )
      ).toEqual({
        beforeFiles: [
          {
            destination: '/top/',
            has: [{ key: 'next-with-split', type: 'cookie', value: 'main' }],
            source: '/'
          },
          {
            destination: 'https://example.com/:path*',
            has: [
              { key: 'next-with-split', type: 'cookie', value: 'challenger' }
            ],
            source: '/:path*'
          },
          {
            destination: '/foo/',
            source: '/bar',
            has: [
              { key: 'next-with-split', type: 'cookie', value: 'main' },
              { key: 'baz', type: 'cookie', value: 'qux' }
            ]
          },
          { destination: '/_split-challenge', source: '/:path*/' }
        ]
      })

      expect(
        mergeRewrites(
          {
            beforeFiles: [
              {
                destination: '/foo/',
                source: '/bar'
              }
            ]
          },
          activeRewrite
        )
      ).toEqual({
        beforeFiles: [
          {
            destination: '/top/',
            has: [{ key: 'next-with-split', type: 'cookie', value: 'main' }],
            source: '/'
          },
          {
            destination: 'https://example.com/:path*',
            has: [
              { key: 'next-with-split', type: 'cookie', value: 'challenger' }
            ],
            source: '/:path*'
          },
          {
            destination: '/foo/',
            source: '/bar',
            has: [{ key: 'next-with-split', type: 'cookie', value: 'main' }]
          },
          { destination: '/_split-challenge', source: '/:path*/' }
        ]
      })

      expect(
        mergeRewrites(
          {
            afterFiles: [
              {
                destination: '/foo/',
                source: '/bar'
              }
            ]
          },
          activeRewrite
        )
      ).toEqual({
        beforeFiles: [
          {
            destination: '/top/',
            has: [{ key: 'next-with-split', type: 'cookie', value: 'main' }],
            source: '/'
          },
          {
            destination: 'https://example.com/:path*',
            has: [
              { key: 'next-with-split', type: 'cookie', value: 'challenger' }
            ],
            source: '/:path*'
          },
          { destination: '/_split-challenge', source: '/:path*/' }
        ],
        afterFiles: [
          {
            destination: '/foo/',
            source: '/bar'
          }
        ]
      })
    })
  })
})
