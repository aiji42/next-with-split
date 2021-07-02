module.exports = {
  rewrites: async () => ({
    beforeFiles: [
      {
        source: '/top',
        has: [{ type: 'query',
          key: 'next-with-split`', value: 'aaa' }],
        destination: '/top',
      },
      {
        source: '/top/',
        has: [{ type: 'query',
          key: 'next-with-split', value: 'aaa' }],
        destination: '/top',
      },
      {
        source: '/_split-challenge',
        destination: '/top',
      },
      {
        source: '/_split-challenge/',
        destination: '/top',
      },
      {
        source: '/hoge',
        destination: '/_split-challenge',
      },
      {
        source: '/hoge',
        destination: '/_split-challenge',
      },
      {
        source: '/hoge/',
        destination: '/_split-challenge',
      }
    ]
  })
}