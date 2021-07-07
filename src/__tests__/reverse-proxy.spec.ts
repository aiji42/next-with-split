import { _reverseProxy } from '../reverse-proxy'
import { request as httpRequest } from 'http'
import { request } from 'https'

jest.mock('http', () => ({
  request: jest.fn()
}))

jest.mock('https', () => ({
  request: jest.fn()
}))

const on = () => {
  return { on }
}

const noop = () => {
  // noop
}

describe('_reverseProxy', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('must call https request when secure', () => {
    ;(httpRequest as jest.Mock).mockReturnValue({ on })
    ;(request as jest.Mock).mockReturnValue({ on })
    _reverseProxy(
      { req: { pipe: noop }, res: {} } as never,
      { host: 'example.com', path: '/', method: 'GET' },
      true
    )
    expect(request).toBeCalled()
    expect(httpRequest).not.toBeCalled()
  })
  it('must call http request when not secure', () => {
    ;(httpRequest as jest.Mock).mockReturnValue({ on })
    ;(request as jest.Mock).mockReturnValue({ on })
    _reverseProxy(
      { req: { pipe: noop }, res: {} } as never,
      { host: 'example.com', path: '/', method: 'GET' },
      false
    )
    expect(request).not.toBeCalled()
    expect(httpRequest).toBeCalled()
  })
})
