/* eslint @typescript-eslint/no-var-requires: 0 */
const withSplit = require('next-with-split')({
  splits: {
    test1: {
      path: '/foo/*',
      hosts: {
        original: 'https://next-with-split.vercel.app',
        challenger1:
          'https://next-with-split-git-challenger-sample-aiji42.vercel.app'
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
