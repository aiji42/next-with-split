import { checkExistingSplitChallenge } from './check-existing-split-challenge'
import { findPageFile } from 'next/dist/server/lib/find-page-file'

jest.mock('next/dist/lib/find-pages-dir', () => ({
  findPagesDir: () => 'app'
}))

jest.mock('next/dist/server/lib/find-page-file', () => ({
  findPageFile: jest.fn()
}))

jest.spyOn(console, 'error').mockImplementation((mes) => console.log(mes))
describe('checkExistingSplitChallenge', () => {
  it('must return true when existing _split-challenge', () => {
    ;(findPageFile as jest.Mock).mockReturnValue(
      new Promise((resolve) => resolve('pages/_split-challenge.tsx'))
    )
    return checkExistingSplitChallenge().then((res) =>
      expect(res).toEqual(true)
    )
  })

  it('must return false when not existing _split-challenge', () => {
    ;(findPageFile as jest.Mock).mockReturnValue(
      new Promise((resolve) => resolve(null))
    )
    return checkExistingSplitChallenge().then((res) =>
      expect(res).toEqual(false)
    )
  })
})
