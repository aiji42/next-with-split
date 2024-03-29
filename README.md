[![codecov](https://codecov.io/gh/aiji42/next-with-split/branch/main/graph/badge.svg?token=P126VM3CI1)](https://codecov.io/gh/aiji42/next-with-split)
[![npm version](https://badge.fury.io/js/next-with-split.svg)](https://badge.fury.io/js/next-with-split)

![How it works 01](https://github.com/aiji42/next-with-split/blob/main/readme/00.png?raw=true)

# :ab: next-with-split

**This is magic!:crystal_ball:**  
It enables branch-based split testing (A/B testing) on Vercel and other providers, just like the Netify's [Split Testing](https://docs.netlify.com/site-deploys/split-testing/).

This plugin lets you divide traffic to your site between different deploys, straight from CDN network. It is not the traditional split testing on a per-component or per-page file basis.   
You deploy the main branch (original) and the branch derived from it (challenger) on Vercel and other providers, and use Next.js middleware and cookies to separate two or more environments. Since there is no need to duplicate code, it is easier to manage and prevents the bundle size from increasing.

## Example

[A/B test example](https://next-with-split-aiji42.vercel.app/foo/bar)

## How it works

![How it works 01](https://github.com/aiji42/next-with-split/blob/main/readme/01.png?raw=true)

![How it works 02](https://github.com/aiji42/next-with-split/blob/main/readme/02.png?raw=true)

## Require

- Using Next.js >=13

If you are using Next.js v12 series, use next-with-split@5.1.0.

## Installation

```
npm install --save next-with-split
```

## Usage
1\. Customize `next.config.js` and create `middleware.ts`. (in main branch)
```js
// next.config.js
const withSplit = require('next-with-split').withSplit({})

module.export = withSplit({
  // write your next.js configuration values.
})
```

```js
// middleware.ts
export { middleware } from 'next-with-split'
```

If you already have middleware code, please refer to the following.
```js
// middleware.ts
import { middleware as withSplit } from 'next-with-split'

export const middleware = (req) => {
  const res = withSplit(req)
  // write your middleware code
  return res
}
```

2\. Derive a branch from the main branch as challenger. 
- **NOTE:** Challenger branch also needs to have `next.config.js` customized (No. 1).

3\. Deploy the challenger branch for preview and get the hostname.

4\. Modify next.config.js in the main branch.
```js
// next.config.js
const withSplit = require('next-with-split').withSplit({
  splits: {
    example1: { // Identification of A/B tests (any)
      path: '/foo/*', // Paths to perform A/B testing. (regular expression)
      hosts: {
        // [branch name]: host name
        original: 'example.com',
        'challenger-for-example1': 'challenger-for-example1.vercel.app',
      },
      cookie: { // Optional (For Sticky's control)
        maxAge: 60 * 60 * 12 * 1000 // Number of valid milliseconds for sticky sessions. (default is 1 day)
      }
    },
    // Multiple A/B tests can be run simultaneously.
    example2: {
      path: '/bar/*',
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
const withSplit = require('next-with-split').withSplit({
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
const withSplit = require('next-with-split').withSplit({
  splits: {
    example1: {
      path: '/foo/*',
      hosts: {
        // original : challenger1 : challenger2 = 3(50%) : 2(33%) : 1(16%)
        original: { host: 'example.com', weight: 3 },
        challenger1: { host: 'challenger1.vercel.app', weight: 2 },
        challenger2: 'challenger2.vercel.app', // If `weight` is not specified, the value is 1.
      }
    }
  }
})
```

## Impact on Performance

This library uses middleware to allocate A/B tests. In general, inserting middleware into the route of the content adds some overhead.  
We actually deployed it to Vercel and measured the difference between the original and challenger, and the average difference was 70 to 90ms ([#137](https://github.com/aiji42/next-with-split/issues/137#issuecomment-993518576)).  
The challenger is rewritten to a different host according to the configuration in the middleware, which causes a round trip.  
The original also had an overhead of about 50ms compared to when no A/B testing was done (when no middleware was deployed). In other words, the challenger has a delay of up to 150ms compared to when it is not A/B tested.  
Once the user lands on a page, these delays are not a big problem since navigation between pages is resolved quickly by prefetch, but be careful when landing or processing a full page reload. (Google says that TTFB should be less than 200ms.)

To avoid adding unnecessary latency...
1. Make sure that the middlewares do not get into routes that are not related to A/B testing.
    - Use [`confit.matcher`](https://nextjs.org/docs/advanced-features/middleware#matcher) to limit the scope of influence of the middleware to the target path of the A/B test.
2. The middleware for next-with-split is not needed in challengers, so remove the middlewares. (You do need to configure next.config.js, however.)
3. While stopping A/B tests, remove the middlewares.

## Contributing
Please read [CONTRIBUTING.md](https://github.com/aiji42/next-with-split/blob/main/CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## License
This project is licensed under the MIT License - see the [LICENSE](https://github.com/aiji42/next-with-split/blob/main/LICENSE) file for details
