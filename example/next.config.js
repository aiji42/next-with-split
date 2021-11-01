/* eslint @typescript-eslint/no-var-requires: 0 */
// const withSplit = require('next-with-split')({
// splits: {
//     test1: {
//       path: '/foo/abtest/:path*',
//       hosts: {
//         original: { host: 'http://localhost:3000', weight: 3 },
//         // original: 'https://nextjs-split-test-git-abtest-original-2021-07-04-aiji42.vercel.app',
//         challenger:
//           'https://nextjs-split-test-git-abtest-example-2021-07-04-aiji42.vercel.app'
//       }
//     },
//     test2: {
//       path: '/top',
//       hosts: {
//         original: 'http://localhost:3000',
//         challenger:
//           'https://nextjs-split-test-git-abtest-example-2021-07-04-aiji42.vercel.app'
//       }
//     }
//   },
// prepared: true,
// isOriginal: true
// })

// module.exports = withSplit({
//   rewrites: async () => ({
//     beforeFiles: [
//       {
//         source: '/foo/:path*',
//         destination: '/foo/bar'
//       }
//     ]
//   })
// })

const withSplit = require('next-with-split')({
  splits: {
    test1: {
      path: '/foo/*',
      hosts: {
        original: 'https://next-with-split.vercel.app',
        challenger1:
          'https://nextjs-split-test-git-abtest-example-2021-07-04-aiji42.vercel.app'
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
