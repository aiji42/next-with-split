import { GetServerSideProps } from 'next'
import { getServerSideProps as original } from 'next-with-split/build/split-challenge'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  console.log(ctx.query)
  return original(ctx)
}

const SplitChallenge = () => null
export default SplitChallenge
