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

module.exports = {
  env: {
    splits: {
      example1: {
        path: '/foo/*',
        hosts: {
          // original : challenger1 : challenger2 = 3(50%) : 2(33%) : 1(16%)
          original: { host: 'localhost:3000', weith: 3 },
          challenger1: { host: 'https://nextjs-split-test-git-abtest-example-2021-07-04-aiji42.vercel.app', weight: 2 },
        },
        cookie: { // Optional (For Sticky's control)
          maxAge: 60 * 60 * 12 // Number of valid seconds for sticky sessions. (default is 1 day)
        }
      }
    }
  }
}