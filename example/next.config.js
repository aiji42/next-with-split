/* eslint @typescript-eslint/no-var-requires: 0 */
const withSplit = require('next-with-split')({
  splits: {
    test1: {
      path: '/foo/*',
      hosts: {
        original: 'next-with-split.vercel.app',
        challenger1: 'next-with-split-git-challenger-sample-aiji42.vercel.app'
      }
    }
  },
  middleware: { manage: true, paths: ['pages/foo/_middleware.ts'] }
})

module.exports = withSplit({
  async redirects() {
    return [
      {
        source: '/',
        destination: '/foo/bar',
        permanent: false
      }
    ]
  }
})
