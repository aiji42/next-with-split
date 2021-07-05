import { prepareSplitChallenge } from './prepare-split-challenge'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { findPagesDir } from 'next/dist/lib/find-pages-dir'
import { SplitOptions } from './types'

jest.mock('fs', () => ({
  writeFileSync: jest.fn(),
  existsSync: jest.fn(),
  mkdirSync: jest.fn()
}))

jest.mock('next/dist/lib/find-pages-dir', () => ({
  findPagesDir: jest.fn()
}))

jest.spyOn(console, 'error').mockImplementation((mes) => console.log(mes))
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const mockExit = jest
  .spyOn(process, 'exit')
  .mockImplementation((code) => console.log('exit: ', code))

describe('prepareSplitChallenge', () => {
  const OLD_ENV = process.env
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    process.env = { ...OLD_ENV }
  })
  afterAll(() => {
    process.env = OLD_ENV
  })
  it('must make split-challenge script when runs on production', () => {
    process.env = { ...process.env, VERCEL_ENV: 'production' }
    ;(findPagesDir as jest.Mock).mockReturnValue('pages')
    ;(existsSync as jest.Mock).mockReturnValue(false)
    prepareSplitChallenge({})
    expect(mkdirSync).toBeCalled()
    expect(writeFileSync).toBeCalledWith(
      'pages/_split-challenge/[__key].js',
      `export { getServerSideProps } from 'next-with-split'
const SplitChallenge = () => null
export default SplitChallenge
`
    )
  })
  it('must not call mkdirSync when existing directory', () => {
    process.env = { ...process.env, VERCEL_ENV: 'production' }
    ;(findPagesDir as jest.Mock).mockReturnValue('pages')
    ;(existsSync as jest.Mock).mockReturnValue(true)
    prepareSplitChallenge({})
    expect(mkdirSync).not.toBeCalled()
  })
  it('must not work when runs on not production', () => {
    prepareSplitChallenge({})
    expect(writeFileSync).not.toBeCalled()
  })
  it('must not work when challenge file is existing', () => {
    process.env = { ...process.env, VERCEL_ENV: 'production' }
    prepareSplitChallenge({ challengeFileExisting: true } as SplitOptions)
    expect(writeFileSync).not.toBeCalled()
  })
  it('must request a self-creation when an exception is raised', () => {
    process.env = { ...process.env, VERCEL_ENV: 'production' }
    ;(findPagesDir as jest.Mock).mockImplementation(() => {
      throw new Error('some error.')
    })
    prepareSplitChallenge({})
    expect(writeFileSync).not.toBeCalled()
    expect(mockExit).toBeCalledWith(1)
  })
})
