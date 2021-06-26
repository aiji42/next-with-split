const { nextWithSplit } = require('next-with-split')

module.exports = nextWithSplit({
  splits: {
    rootPage: 'top',
    branchMappings: {
      abtest_challenger:
        'https://nextjs-split-test-git-abtestchallenger-aiji42.vercel.app'
    },
    active: true
  },
  reactStrictMode: true
})
