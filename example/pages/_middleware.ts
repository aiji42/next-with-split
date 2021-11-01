import { middleware } from 'next-with-split'
import { NextRequest } from 'next/server'
export default function (req: NextRequest) {
  console.log(req.nextUrl)
  return middleware(req)
}
