import { makeRewrites } from '../make-rewrites'

describe('makeRewrites', () => {
  it('must return a rewrite rule', () => {
    return makeRewrites(
      {
        foo: {
          path: '/foo/:path*',
          hosts: {
            branch1: 'https://branch1.example.com',
            branch2: 'https://branch2.example.com'
          }
        }
      },
      undefined,
      true
    )().then((res) => {
      expect(res).toEqual({
        beforeFiles: [
          {
            source: '/foo/:path*',
            destination: '/_split-challenge/foo',
            has: [{ type: 'header', key: 'user-agent' }]
          }
        ]
      })
    })
  })

  it('must return rewrite rules', () => {
    return makeRewrites(
      {
        foo: {
          path: '/foo/:path*',
          hosts: {
            branch1: 'https://branch1.example.com',
            branch2: 'https://branch2.example.com'
          }
        },
        bar: {
          path: '/bar/:path*',
          hosts: {
            branch3: 'https://branch3.example.com',
            branch4: 'https://branch4.example.com'
          }
        }
      },
      undefined,
      true
    )().then((res) => {
      expect(res).toEqual({
        beforeFiles: [
          {
            source: '/foo/:path*',
            destination: '/_split-challenge/foo',
            has: [{ type: 'header', key: 'user-agent' }]
          },
          {
            source: '/bar/:path*',
            destination: '/_split-challenge/bar',
            has: [{ type: 'header', key: 'user-agent' }]
          }
        ]
      })
    })
  })

  it('must return no rewrite rule when option is empty', () => {
    return makeRewrites({}, undefined, true)().then((res) => {
      expect(res).toEqual({
        beforeFiles: []
      })
    })
  })

  it('must return no rewrite rule when runs on NOT main branch', () => {
    return makeRewrites({}, undefined, false)().then((res) => {
      expect(res).toEqual({
        beforeFiles: []
      })
    })
  })

  it('must return merged rewrite rules', () => {
    return makeRewrites(
      {
        foo: {
          path: '/foo/:path*',
          hosts: {
            branch1: 'https://branch1.example.com',
            branch2: 'https://branch2.example.com'
          }
        }
      },
      async () => [{ source: '/foo/bar/:path*', destination: '/foo/bar' }],
      true
    )().then((res) => {
      expect(res).toEqual({
        beforeFiles: [
          {
            source: '/foo/:path*',
            destination: '/_split-challenge/foo',
            has: [{ type: 'header', key: 'user-agent' }]
          }
        ],
        afterFiles: [
          {
            source: '/foo/bar/:path*',
            destination: '/foo/bar'
          }
        ]
      })
    })
  })
})
