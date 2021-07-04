const { withSplit } = require('next-with-split')

module.exports = withSplit({
  splits: {
    test1: {
      path: '/foo/:path*/',
      hosts: {
        branch1: 'example1.vercel.app',
        branch2: 'example2.vercel.app'
      }
    }
  },
  trailingSlash: true
})