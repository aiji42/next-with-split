import { NextMiddleware, NextResponse } from 'next/server'
import { middleware } from 'next-with-split'

const _middleware: NextMiddleware = (req) => {
  console.log(req.nextUrl)
  return middleware(req)
}

export default _middleware
