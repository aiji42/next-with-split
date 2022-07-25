/* eslint @typescript-eslint/no-var-requires: 0 */
const withSplit = require('next-with-split').withSplit({})

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
