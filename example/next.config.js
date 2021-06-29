const { withSplit } = require('next-with-split')

module.exports = withSplit({
  splits: {
    rootPage: 'top',
    branchMappings: {
      abtest_challenger:
        'https://nextjs-split-test-git-abtestchallenger-aiji42.vercel.app'
    },
    active: true
  },
  reactStrictMode: true,
  rewrites: async () => [
    {
      source: '/foo/:path*/',
      destination: '/foo/bar'
    }
  ]
})
