// eslint-disable-next-line @typescript-eslint/no-var-requires
const { withSplit } = require('next-with-split')

module.exports = withSplit({
  splits: {
    rootPage: 'top',
    branchMappings: {
      challenger:
        'http://localhost:3001'
    }
  },
  reactStrictMode: true,
  rewrites: async () => [
    {
      source: '/foo/:path*/',
      destination: '/foo/bar'
    }
  ]
})
 