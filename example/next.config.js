/* eslint @typescript-eslint/no-var-requires: 0 */
const withSplit = require('next-with-split').withSplit({
  splits: {
    test1: {
      path: '/foo/*',
      hosts: {
        original: 'next-with-split.vercel.app',
        challenger1: 'next-with-split-git-challenger-aiji42.vercel.app'
      }
    }
  }
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
