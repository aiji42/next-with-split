module.exports = {
  rewrites: async () => ({
    beforeFiles: [
      {
        source: '/foo/:path*',
        destination: '/_split-challenge',
      },
      {
        source: '/foo/:path*/',
        destination: '/_split-challenge',
      }
    ]
  })
}