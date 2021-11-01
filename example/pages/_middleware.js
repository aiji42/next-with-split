import { middleware } from 'next-with-split'
export default function(req) {
  console.log(req.nextUrl)
  return middleware(req)
}
