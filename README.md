[![codecov](https://codecov.io/gh/aiji42/next-with-split/branch/main/graph/badge.svg?token=P126VM3CI1)](https://codecov.io/gh/aiji42/next-with-split)
[![npm version](https://badge.fury.io/js/next-with-split.svg)](https://badge.fury.io/js/next-with-split)

# :ab: next-with-split

This is magic!  It enables split testing (AB testing) in branches on Vercel, just like the Netify feature.  
[netlify - Split Testing](https://docs.netlify.com/site-deploys/split-testing/)

This is not the traditional split testing on a per-component or per-page file basis.  
You deploy the main branch (original) and the branch derived from it (challenger) on Vercel, and use Next.js Rewrite Rules and Cookies to separate two or more environments.  
Since there is no need to duplicate code, it is easier to manage and prevents the bundle size from increasing.

## Prerequisite

- useing Next.js >=10.1
- hosting by Vercel.

Theoretically, you could use this package with any provider other than Vercel if you can deploy a preview environment. However, at the moment, it only works with Vecel because some logic depends on Vercel's environment variables.  
Contributions and requests are welcome.

## Installation

```
npm install --save next-with-split
```

## Usage
1. Customize next.config.js. (in main branch)
```js
// next.config.js
const { withSplit } = require('next-with-split');

module.export = withSplit({
  // write your next.js configuration values.
})
```

2. Create `pages/_split-challenge.ts` (`.js`). (in main branch)  
```ts
// pages/_split-challenge.ts (.js)
export { getServerSideProps } from 'next-with-split'
const SplitChallenge = () => null
export default SplitChallenge
```
This file is a function to provide cookies for content separation.

3. Derive a branch for Challenger and modify the content.

4. Deploy the Challenger branch in Vercel for preview and get the URL.

5. Modify next.config.js in both the main branch and the challenger branch.

```js
// next.config.js
const { withSplit } = require('next-with-split');

module.export = withSplit({
  splits: {
    branchMappings: {
      your-challenger-branch: // challenger branch name
        'https://example-challenger-branch.vercel.app' // preview URL
    }
  }
  // write your next.js configuration values.
})
```

6. Deploy both the main branch and the challenger branch.

## withSplit

```ts
const withSplit = (args: WithSplitArgs) => WithSplitResult

type Options = {
  branchMappings: { [branch: string]: string }
  rootPage: string
  mainBranch: string
  active: boolean
}

type WithSplitArgs = {
  splits?: Partial<Options>
  [x: string]: unknown // next.js configuration values.
}
```

### Options

|key|type|note|
| ---- | ---- | ---- |
|branchMappings|{ [branch: string]: string } \| undefined|Set the map data with the challenger branch name as the key and the preview URL corresponding to that branch as the value.<br />You can specify more than one challenger as in A/B/C testing.|
|rootPage|string \| undefined|**default: 'top'**<br />If there is a page file corresponding to /(index), specify the file name (no extension required).<br />Unfortunately, pages/index.tsx\|jsx cannot be used, so you will need to rename it. [See more](https://github.com/aiji42/next-with-split#Supplement)|
|mainBranch|string \| undefined|**default: 'main'**<br />Specify the name of the branch that is registered as the production branch on Vercel.|
|active|boolean \| undefined|If you want to force the function to be active in a development, set it to `true`.<br />If you start a split test with the challenger branch set to `active: true`, you will get serious problems such as redirection loops. Be sure to keep the change of this setting value to the development environment.|

## Supplement

### page/index.tsx cannot be used

The root page name cannot be `index`. (This seems to be a restriction of the rewrite rules.)

You can continue to treat it as the root page by renaming it to something other than `index` and specifying the `withSplit` option as `rootPage: 'top'`.

### trailingSlash will be forced to be true

It cannot be set to `trailingSlash: false`. (This seems to be a restriction of the rewrite rules.)

## Structure

making ...

## LICENSE

[MIT](https://github.com/aiji42/next-with-split/blob/main/LICENSE) © AijiUejima