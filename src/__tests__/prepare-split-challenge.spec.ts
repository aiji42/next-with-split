import { prepareSplitChallenge } from '../prepare-split-challenge'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { findPagesDir } from 'next/dist/lib/find-pages-dir'

jest.mock('fs', () => ({
  writeFileSync: jest.fn(),
  existsSync: jest.fn(),
  mkdirSync: jest.fn()
}))

jest.mock('next/dist/lib/find-pages-dir', () => ({
  findPagesDir: jest.fn()
}))

jest.spyOn(console, 'error').mockImplementation((mes) => console.log(mes))

const mockExit = jest
  .spyOn(process, 'exit')
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  .mockImplementation((code) => console.log('exit: ', code))

describe('prepareSplitChallenge', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('must make split-challenge script when runs on production', () => {
    ;(findPagesDir as jest.Mock).mockReturnValue('pages')
    ;(existsSync as jest.Mock).mockReturnValue(false)
    prepareSplitChallenge(true)
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
    ;(findPagesDir as jest.Mock).mockReturnValue('pages')
    ;(existsSync as jest.Mock).mockReturnValue(true)
    prepareSplitChallenge(true)
    expect(mkdirSync).not.toBeCalled()
  })
  it('must not work when runs on not production', () => {
    prepareSplitChallenge(false)
    expect(writeFileSync).not.toBeCalled()
  })
  it('must not work when challenge file is existing', () => {
    prepareSplitChallenge(true)
    expect(writeFileSync).not.toBeCalled()
    ;(existsSync as jest.Mock).mockImplementation((path: string) =>
      path.includes('[__key].ts')
    )
    prepareSplitChallenge(true)
    expect(writeFileSync).not.toBeCalled()
    ;(existsSync as jest.Mock).mockImplementation((path: string) =>
      path.includes('[__key].tsx')
    )
    prepareSplitChallenge(true)
    expect(writeFileSync).not.toBeCalled()
    ;(existsSync as jest.Mock).mockImplementation((path: string) =>
      path.includes('[__key].js')
    )
    prepareSplitChallenge(true)
    expect(writeFileSync).not.toBeCalled()
    ;(existsSync as jest.Mock).mockImplementation((path: string) =>
      path.includes('[__key].jsx')
    )
    prepareSplitChallenge(true)
    expect(writeFileSync).not.toBeCalled()
  })
  it('must request a self-creation when an exception is raised', () => {
    ;(findPagesDir as jest.Mock).mockImplementation(() => {
      throw new Error('some error.')
    })
    prepareSplitChallenge(true)
    expect(writeFileSync).not.toBeCalled()
    expect(mockExit).toBeCalledWith(1)
  })
})
