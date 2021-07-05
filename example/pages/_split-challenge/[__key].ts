import { GetServerSideProps } from 'next'
import { getServerSideProps as original } from 'next-with-split'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  console.log(ctx.query)
  return original(ctx)
}

const SplitChallenge = () => null
export default SplitChallenge
