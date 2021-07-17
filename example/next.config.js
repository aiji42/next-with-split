const withSplit = require('next-with-split')({
  splits: {
    test1: {
      path: '/foo/abtest/:path*',
      hosts: {
        original: 'http://localhost:3000',
        // original: 'https://nextjs-split-test-git-abtest-original-2021-07-04-aiji42.vercel.app',
        challenger: 'https://nextjs-split-test-git-abtest-example-2021-07-04-aiji42.vercel.app'
      }
    },
    test2: {
      path: '/top',
      hosts: {
        original: 'http://localhost:3000',
        challenger: 'https://nextjs-split-test-git-abtest-example-2021-07-04-aiji42.vercel.app'
      }
    }
  },
  prepared: true,
  isOriginal: true
})

module.exports = withSplit({
  rewrites: async () => ({
    beforeFiles: [
      {
        source: '/foo/:path*',
        destination: '/foo/bar'
      }
    ]
  })
})