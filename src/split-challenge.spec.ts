import { getSplitConfig, getPath, sticky, runReverseProxy, getServerSideProps } from './split-challenge'
import { reverseProxy } from './reverse-proxy'
import { parseCookies, setCookie } from 'nookies'
import getConfig from 'next/config'
import { GetServerSidePropsContext } from 'next'
import { SplitConfig } from './types'

jest.mock('nookies', () => ({
  parseCookies: jest.fn(),
  setCookie: jest.fn()
}))

jest.mock('./reverse-proxy', () => ({
  reverseProxy: jest.fn()
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
      expect(getSplitConfig({} as GetServerSidePropsContext, 'test1')).toEqual({
        branch: 'branch1',
        cookie: { path: '/', maxAge: 60 * 60 * 24 },
        host: 'https://branch1.example.com',
        path: '/foo/:path*'
      })
    })
    it('must return A or B split config when cookie is not set', () => {
      ;(parseCookies as jest.Mock).mockReturnValue({})
      expect(getSplitConfig({} as GetServerSidePropsContext, 'test1')).toMatchObject({
        branch: expect.any(String),
        cookie: { path: '/', maxAge: 60 * 60 * 24 },
        host: expect.any(String),
        path: '/foo/:path*'
      })
    })
  })

  describe('getPath', () => {
    it('must return path string when using ":path*"', () => {
      expect(getPath({ path: '/foo/:path*' } as SplitConfig, { path: ['foo', 'bar'] })).toEqual('/foo/foo/bar')
      expect(getPath({ path: '/foo/:path*/' } as SplitConfig, { path: ['foo', 'bar'] })).toEqual('/foo/foo/bar/')
      expect(getPath({ path: '/foo/:path*/bar' } as SplitConfig, { path: ['foo', 'bar'] })).toEqual('/foo/foo/bar/bar')
      expect(getPath({ path: '/foo/:path*' } as SplitConfig, {})).toEqual('/foo/')
      expect(getPath({ path: '/foo/:path*' } as SplitConfig, { path: 'bar' })).toEqual('/foo/bar')
    })
    it('must return path string when using regex conditions', () => {
      expect(getPath({ path: '/foo/bar-:id(\\d+)' } as SplitConfig, { id: '123' })).toEqual('/foo/bar-123')
      expect(getPath({ path: '/foo/bar-:id(\\d+)/xyz-:slug(\\w+)' } as SplitConfig, {
        id: '123',
        slug: 'xyz'
      })).toEqual('/foo/bar-123/xyz-xyz')
    })
    it('must return path string when using complex conditions', () => {
      expect(getPath({ path: '/foo/bar-:id(\\d+)/xyz-:slug(\\w+)/country-:country(japan|america)/:path*' } as SplitConfig, {
        id: '123',
        slug: 'xyz',
        country: 'japan',
        path: ['aaa', 'bbb']
      })).toEqual('/foo/bar-123/xyz-xyz/country-japan/aaa/bbb')
    })
  })

  describe('sticky', () => {
    it('must call', () => {
      sticky({} as GetServerSidePropsContext, {
        branch: 'branch1',
        cookie: { path: '/', maxAge: 60 }
      } as never, 'test1')
      expect(setCookie).toBeCalledWith({}, 'x-split-key-test1', 'branch1', { path: '/', maxAge: 60 })
    })
  })

  describe('runReverseProxy', () => {
    it('must call http reverse proxy when host specified protocol as http', () => {
      return runReverseProxy({
        req: { method: 'GET' },
        res: {},
        query: {}
      } as GetServerSidePropsContext, {
        host: 'http://example.com',
        path: '/foo'
      } as SplitConfig).then(() => {
        expect(reverseProxy).toBeCalledWith({ req: { method: 'GET' }, res: {} }, {
          host: 'example.com',
          path: '/foo',
          method: 'GET',
          port: ''
        }, false)
      })
    })
    it('must call https reverse proxy when host specified protocol as https', () => {
      return runReverseProxy({
        req: { method: 'GET' },
        res: {},
        query: {}
      } as GetServerSidePropsContext, {
        host: 'https://example.com',
        path: '/foo'
      } as SplitConfig).then(() => {
        expect(reverseProxy).toBeCalledWith({ req: { method: 'GET' }, res: {} }, {
          host: 'example.com',
          path: '/foo',
          method: 'GET',
          port: ''
        }, true)
      })
    })
    it('must call https reverse proxy when host not specified protocol', () => {
      return runReverseProxy({
        req: { method: 'GET' },
        res: {},
        query: {}
      } as GetServerSidePropsContext, {
        host: 'example.com',
        path: '/foo'
      } as SplitConfig).then(() => {
        expect(reverseProxy).toBeCalledWith({ req: { method: 'GET' }, res: {} }, {
          host: 'example.com',
          path: '/foo',
          method: 'GET',
          port: ''
        }, false)
      })
    })
  })

  describe('getServerSideProps', () => {
    it('must return props', () => {
      ;(parseCookies as jest.Mock).mockReturnValue({ 'x-split-key-test1': 'branch1' })
      return getServerSideProps({
        res: {},
        req: {},
        query: { __key: 'test1' }
      } as never).then((res) => expect(res).toEqual({ props: {} }))
    })
  })
})