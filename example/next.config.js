module.exports = {
  serverRuntimeConfig: {
    splits: {
      test1: {
        original: { host: 'lifedot-list-o3j04lux4-ending.vercel.app', path: '/ohaka/pref-:pref(tokyo|aichi)/:path*/list/', cookie: {
            path: '/',
            maxAge: 10
          } },
        challenger: { host: 'lifedot-list-o3j04lux4-ending.vercel.app', path: '/ohaka/pref-:pref(tokyo|aichi)/:path*/list/', cookie: {
            path: '/',
            maxAge: 10
          } }
      }
    }
  },
  rewrites: async () => ({
    beforeFiles: [
      {
        source: '/ohaka/pref-:pref(tokyo|aichi)/:path*/list/',
        destination: '/_split-challenge/test1',
      }
    ]
  }),
  trailingSlash: true
}