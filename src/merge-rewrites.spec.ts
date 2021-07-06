import { mergeRewrites } from './merge-rewrites'
import { Rewrites } from './types'

const newRewrites: Rewrites = [
  {
    destination: '/foo/:path*',
    source: '/_split-challenge/foo',
    has: [{ type: 'header', key: 'user-agent' }]
  },
  {
    destination: '/bar/:path*',
    source: '/_split-challenge/bar',
    has: [{ type: 'header', key: 'user-agent' }]
  }
]

describe('mergeRewrites', () => {
  describe('originalRewrite is undefined', () => {
    it('must return untouched rewrite', () => {
      expect(mergeRewrites(undefined, newRewrites)).toEqual({
        beforeFiles: newRewrites
      })
    })
  })

  describe('originalRewrite is array type rewrite', () => {
    it('must return merged object type rules', () => {
      expect(
        mergeRewrites(
          [
            {
              destination: '/foo/',
              source: '/bar'
            }
          ],
          newRewrites
        )
      ).toEqual({
        beforeFiles: newRewrites,
        afterFiles: [
          {
            destination: '/foo/',
            source: '/bar'
          }
        ]
      })
    })
  })

  describe('originalRewrite is object type rewrite', () => {
    it('must return merged into beforeFiles', () => {
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
          newRewrites
        )
      ).toEqual({
        beforeFiles: [
          ...newRewrites,
          {
            destination: '/foo/',
            source: '/bar'
          }
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
          newRewrites
        )
      ).toEqual({
        beforeFiles: newRewrites,
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
