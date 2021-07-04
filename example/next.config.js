const { withSplit } = require('next-with-split')

module.exports = withSplit({
  splits: {
    test1: {
      path: '/ohaka/pref-:pref(tokyo|aichi)/:path*/list/',
      hosts: {
        branch1: 'lifedot-list-o3j04lux4-ending.vercel.app',
        branch2: 'lifedot-list-o3j04lux4-ending.vercel.app'
      }
    }
  },
  trailingSlash: true
})