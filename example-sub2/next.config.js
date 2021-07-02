module.exports = {
  assetPrefix: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3001',
  images: {
    path: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/_next/image` : 'http://localhost:3001/_next/image'
  },
  // rewrites: async () => ({
  //   beforeFiles: [
  //     {
  //       source: '/foo/:path*',
  //       destination: '/foo/bar',
  //     }
  //   ]
  // })
}