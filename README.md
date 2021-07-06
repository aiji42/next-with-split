[![codecov](https://codecov.io/gh/aiji42/next-with-split/branch/main/graph/badge.svg?token=P126VM3CI1)](https://codecov.io/gh/aiji42/next-with-split)
[![npm version](https://badge.fury.io/js/next-with-split.svg)](https://badge.fury.io/js/next-with-split)

# :ab: next-with-split

**This is magic!:crystal_ball:**  
It enables branch-based split testing (AB testing) on Vercel, just like the Netify's [Split Testing](https://docs.netlify.com/site-deploys/split-testing/).

This plugin lets you divide traffic to your site between different deploys, straight from CDN network. It is not the traditional split testing on a per-component or per-page file basis.   
You deploy the main branch (original) and the branch derived from it (challenger) on Vercel, and use Next.js Rewrite Rules and Cookies to separate two or more environments. Since there is no need to duplicate code, it is easier to manage and prevents the bundle size from increasing.

## How it works

![How it works 01](https://github.com/aiji42/next-with-split/blob/main/readme/01.png?raw=true)

![How it works 02](https://github.com/aiji42/next-with-split/blob/main/readme/02.png?raw=true)

## Require

- Using Next.js >=10.1
- Hosting by Vercel.

Theoretically, you could use this package with any provider other than Vercel if you can deploy a preview environment. However, at the moment, it only works with Vecel because some logic depends on Vercel's environment variables.  
Contributions and requests are welcome.

## Installation

```
npm install --save next-with-split
```

## Usage
1\. Customize next.config.js. (in main branch)
```js
// next.config.js
const { withSplit } = require('next-with-split');

module.export = withSplit({
  // write your next.js configuration values.
})
```

2\. Derive a branch from the main branch as challenger. 

3\. Deploy the challenger branch in Vercel for preview and get the hostname.

4\. Modify next.config.js in the main branch.
```js
// next.config.js
const { withSplit } = require('next-with-split');

module.export = withSplit({
  splits: {
    example1: { // Identification of A/B tests (any)
      path: '/foo/:path*', // Paths to perform A/B testing. (Follow the notation of the rewrite rules.)
      hosts: {
        // [branch name]: host name
        original: 'example.com',
        'challenger-for-example1': 'challenger-for-example1.vercel.app',
      },
      cookie: { // Optional (For Sticky's control)
        maxAge: 60 * 60 * 12 // Number of valid seconds for sticky sessions. (default is 1 day)
      }
    },
    // Multiple AB tests can be run simultaneously.
    example2: {
      path: '/bar/:path*',
      hosts: {
        original: 'example.com',
        'challenger-for-example2': 'challenger-for-example2.vercel.app',
        // It is possible to distribute access to two or more targets as in A/B/C testing.
        'challenger2-for-example2': 'challenger2-for-example2.vercel.app',
      }
    }
  }
  // write your next.js configuration values.
})
```
5\. Deploy the main branch.

6\. The network will be automatically split and the content will be served!  
It is also sticky, controlled by cookies.

## MEMO

- If you place `pages/split-challenge/[__key].js` yourself, set `challengeFileExisting: true` in `withSplit`.
```js
withSplit({
  splits: {...},
  // You can skip the automatic generation `pages/split-challenge/[__key].js`.
  challengeFileExisting: true
})
```

- If the deployment is subject to AB testing, `process.env.NEXT_PUBLIC_IS_TARGET_SPLIT_TESTING` is set to 'true'.
    - CAUTION: Only if the key set in `hosts` matches the branch name.

## LICENSE

[MIT](https://github.com/aiji42/next-with-split/blob/main/LICENSE) © AijiUejima
