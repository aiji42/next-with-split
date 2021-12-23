import Link from 'next/link'

const Top = () => {
  return (
    <Link href="/foo/bar" prefetch={false}>
      /foo/bar
    </Link>
  )
}

export default Top
