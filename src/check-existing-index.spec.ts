import { checkExistingIndex } from './check-existing-index'
import { findPageFile } from 'next/dist/server/lib/find-page-file'

jest.mock('next/dist/lib/find-pages-dir', () => ({
  findPagesDir: () => 'app'
}))

jest.mock('next/dist/server/lib/find-page-file', () => ({
  findPageFile: jest.fn()
}))

jest.spyOn(console, 'error').mockImplementation((mes) => console.log(mes))
describe('checkExistingIndex', () => {
  it('must return true when existing index file', () => {
    ;(findPageFile as jest.Mock).mockReturnValue(
      new Promise((resolve) => resolve('pages/index.tsx'))
    )
    return checkExistingIndex().then((res) => expect(res).toEqual(true))
  })

  it('must return false when not existing index file', () => {
    ;(findPageFile as jest.Mock).mockReturnValue(
      new Promise((resolve) => resolve(null))
    )
    return checkExistingIndex().then((res) => expect(res).toEqual(false))
  })
})
