import { mergeRewrites } from './merge-rewrites'

const newRewrites = [
  {
    destination: '/foo/:path*',
    source: '/_split-challenge/foo'
  },
  {
    destination: '/bar/:path*',
    source: '/_split-challenge/bar'
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
    it('must return merged array rules', () => {
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
      ).toEqual([
        ...newRewrites,
        {
          destination: '/foo/',
          source: '/bar'
        }
      ])
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
