[![codecov](https://codecov.io/gh/aiji42/next-with-split/branch/main/graph/badge.svg?token=P126VM3CI1)](https://codecov.io/gh/aiji42/next-with-split)
[![npm version](https://badge.fury.io/js/next-with-split.svg)](https://badge.fury.io/js/next-with-split)

# :ab: next-with-split

**This is magic!:crystal_ball:**  
It enables branch-based split testing (A/B testing) on Vercel and other providers, just like the Netify's [Split Testing](https://docs.netlify.com/site-deploys/split-testing/).

This plugin lets you divide traffic to your site between different deploys, straight from CDN network. It is not the traditional split testing on a per-component or per-page file basis.   
You deploy the main branch (original) and the branch derived from it (challenger) on Vercel and other providers, and use Next.js Rewrite Rules and Cookies to separate two or more environments. Since there is no need to duplicate code, it is easier to manage and prevents the bundle size from increasing.

## How it works

![How it works 01](https://github.com/aiji42/next-with-split/blob/main/readme/01.png?raw=true)

![How it works 02](https://github.com/aiji42/next-with-split/blob/main/readme/02.png?raw=true)

:bulb: In getServerSideProps, it is running an http(s) server to act as a reverse proxy.

Note: Vercel is used as an example, but other providers are supported after v2.5.

## Require

- Using Next.js >=10.2

## Installation

```
npm install --save next-with-split
```

## Usage
1\. Customize next.config.js. (in main branch)
```js
// next.config.js
const withSplit = require('next-with-split')({})

module.export = withSplit({
  // write your next.js configuration values.
})
```

2\. Derive a branch from the main branch as challenger. 

3\. Deploy the challenger branch for preview and get the hostname.

4\. Modify next.config.js in the main branch.
```js
// next.config.js
const withSplit = require('next-with-split')({
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
    // Multiple A/B tests can be run simultaneously.
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
})

module.export = withSplit({
  // write your next.js configuration values.
})
```
- If you use a provider other than Vercel, please configure the following manual.  
**Note: This setting is also required for the Challenger deployments.**
```js
// next.config.js
const withSplit = require('next-with-split')({
  splits: {...},
  isOriginal: false, // Control it so that it is true on the original deployment (basically the main branch) and false on all other deployments.,
  hostname: 'challenger.example.com', // Set the hostname in the Challenger deployment. If this is not set, you will not be able to access the assets and images.
  currentBranch: 'chllenger1', // Optional. Set the value if you use `process.env.NEXT_PUBLIC_IS_TARGET_SPLIT_TESTING`.
})

module.export = withSplit({
  // write your next.js configuration values.
})
```

5\. Deploy the main branch.

6\. The network will be automatically split and the content will be served!  
It is also sticky, controlled by cookies.

## Features

- If you place `pages/split-challenge/[__key].js` yourself, set `prepared: true`.
    - This file acts as a reverse proxy to distribute the access to the target path to each branch deployments.
```js
// pages/split-challenge/[__key].js (.ts when using typescript)
export { getServerSideProps } from 'next-with-split/build/split-challenge'
const SplitChallenge = () => null
export default SplitChallenge
```
```js
// next.config.js
const withSplit = require('next-with-split')({
  splits: {...},
  // You can skip the automatic generation `pages/split-challenge/[__key].js`.
  prepared: true
})
```

- If the deployment is subject to A/B testing, `process.env.NEXT_PUBLIC_IS_TARGET_SPLIT_TESTING` is set to 'true'.
    - CAUTION: Only if the key set in `hosts` matches the branch name.
    
- When Next.js preview mode is turned on, access will automatically be allocated to the original deployment.
    - Set the `hosts` key to `original`, `master` or `main`.

- You can control the behavior of `withSplit` by forcing it by passing an environment variable at server startup.  
Use it for verification in your development environment.
    - `SPLIT_ACTIVE=true yarn dev`: forced active.
    - `SPLIT_DISABLE=true yarn dev`: forced disable.
    
- By default, access to deployments is allocated in equal proportions. If you want to add bias to the access sorting, set `wight`.
```js
// next.config.js
const withSplit = require('next-with-split')({
  splits: {
    example1: {
      path: '/foo/:path*',
      hosts: {
        // original : challenger1 : challenger2 = 3(50%) : 2(33%) : 1(16%)
        original: { host: 'example.com', weith: 3 },
        challenger1: { host: 'challenger1.vercel.app', weight: 2 },
        challenger2: 'challenger2.vercel.app', // If `weight` is not specified, the value is 1.
      },
      cookie: { // Optional (For Sticky's control)
        maxAge: 60 * 60 * 12 // Number of valid seconds for sticky sessions. (default is 1 day)
      }
    }
  }
})
```

## Contributing
Please read [CONTRIBUTING.md](https://github.com/aiji42/next-with-split/blob/main/CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## License
This project is licensed under the MIT License - see the [LICENSE](https://github.com/aiji42/next-with-split/blob/main/LICENSE) file for details
