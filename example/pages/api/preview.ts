import { NextApiHandler } from 'next'

const Preview: NextApiHandler = async (req, res) => {
  res.setPreviewData({})
  res.end('Preview mode enabled')
}

export default Preview
