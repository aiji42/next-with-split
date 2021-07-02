module.exports = {
  rewrites: async () => ({
    beforeFiles: [
      {
        source: '/ohaka/pref-tokyo/list/',
        destination: '/_split-challenge',
      },
      {
        source: '/ohaka/pref-tokyo/list',
        destination: '/_split-challenge',
      }
    ]
  }),
  trailingSlash: true
}