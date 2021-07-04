import { prepareSplitChallenge } from './prepare-split-challenge'
import { writeFileSync } from 'fs'
import { findPagesDir } from 'next/dist/lib/find-pages-dir'


jest.mock('fs', () => ({
  writeFileSync: jest.fn()
}))

jest.mock('next/dist/lib/find-pages-dir', () => ({
  findPagesDir: jest.fn()
}))

describe('prepareSplitChallenge', () => {
  const OLD_ENV = process.env
  beforeEach(() => {
    jest.resetModules()
    process.env = { ...OLD_ENV }
  })
  afterAll(() => {
    process.env = OLD_ENV
  })
  it('must make split-challenge script when runs on production', () => {
    process.env = { ...process.env, VERCEL_ENV: 'production' }
    ;(findPagesDir as jest.Mock).mockReturnValue('pages')
    prepareSplitChallenge()
    expect(writeFileSync).toBeCalledWith('pages/_split-challenge/[__key].js', `
export { getServerSideProps } from 'next-with-split'
const SplitChallenge = () => null
export default SplitChallenge
`
    )
  })
  it('must not work', () => {
    prepareSplitChallenge()
    expect(writeFileSync).not.toBeCalled()
  })
})
