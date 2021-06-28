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
  it('', () => {
    expect(mergeRewrites(undefined, inactiveRewrite)).toEqual(inactiveRewrite)

    expect(mergeRewrites(undefined, activeRewrite)).toEqual(activeRewrite)

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
  })
})
