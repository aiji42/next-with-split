import { getSplitConfig, getPath, sticky } from './split-challenge'
import { parseCookies, setCookie } from 'nookies'
import getConfig from 'next/config'
import { IncomingMessage } from 'http'

jest.mock('nookies', () => ({
  parseCookies: jest.fn(),
  setCookie: jest.fn()
}))

jest.mock('next/config', () => jest.fn())

describe('split-challenge', () => {
  beforeEach(() => {
    ;(getConfig as jest.Mock).mockReturnValue({
      serverRuntimeConfig: {
        splits: {
          test1: {
            branch1: {
              host: 'https://branch1.example.com',
              path: '/foo/:path*',
              cookie: { path: '/', maxAge: 60 * 60 * 24 }
            },
            branch2: {
              host: 'https://branch2.example.com',
              path: '/foo/:path*',
              cookie: { path: '/', maxAge: 60 * 60 * 24 }
            }
          }
        }
      }
    })
  })
  describe('getSplitConfig', () => {
    it('must return specified split config when cookie is set', () => {
      ;(parseCookies as jest.Mock).mockReturnValue({ 'x-split-key-test1': 'branch1' })
      expect(getSplitConfig({} as IncomingMessage, 'test1')).toEqual({
        branch: 'branch1',
        cookie: { path: '/', maxAge: 60 * 60 * 24 },
        host: 'https://branch1.example.com',
        path: '/foo/:path*'
      })
    })
    it('must return A or B split config when cookie is not set', () => {
      ;(parseCookies as jest.Mock).mockReturnValue({})
      expect(getSplitConfig({} as IncomingMessage, 'test1')).toMatchObject({
        branch: expect.any(String),
        cookie: { path: '/', maxAge: 60 * 60 * 24 },
        host: expect.any(String),
        path: '/foo/:path*'
      })
    })
  })

  describe('getPath', () => {
    it('must return path string when using ":path*"', () => {
      expect(getPath({ path: '/foo/:path*' } as never, { path: ['foo', 'bar'] })).toEqual('/foo/foo/bar')
      expect(getPath({ path: '/foo/:path*/' } as never, { path: ['foo', 'bar'] })).toEqual('/foo/foo/bar/')
      expect(getPath({ path: '/foo/:path*/bar' } as never, { path: ['foo', 'bar'] })).toEqual('/foo/foo/bar/bar')
      expect(getPath({ path: '/foo/:path*' } as never, {})).toEqual('/foo/')
      expect(getPath({ path: '/foo/:path*' } as never, { path: 'bar' })).toEqual('/foo/bar')
    })
    it('must return path string when using regex conditions', () => {
      expect(getPath({ path: '/foo/bar-:id(\\d+)' } as never, { id: '123' })).toEqual('/foo/bar-123')
      expect(getPath({ path: '/foo/bar-:id(\\d+)/xyz-:slug(\\w+)' } as never, {
        id: '123',
        slug: 'xyz'
      })).toEqual('/foo/bar-123/xyz-xyz')
    })
    it('must return path string when using complex conditions', () => {
      expect(getPath({ path: '/foo/bar-:id(\\d+)/xyz-:slug(\\w+)/country-:country(japan|america)/:path*' } as never, {
        id: '123',
        slug: 'xyz',
        country: 'japan',
        path: ['aaa', 'bbb']
      })).toEqual('/foo/bar-123/xyz-xyz/country-japan/aaa/bbb')
    })
  })

  describe('sticky', () => {
    sticky({} as never, { branch: 'branch1', cookie: { path: '/', maxAge: 60 } } as never, 'test1')
    expect(setCookie).toBeCalledWith({ res: {} }, 'x-split-key-test1', 'branch1', { path: '/', maxAge: 60 })
  })
})