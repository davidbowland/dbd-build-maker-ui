import '@testing-library/jest-dom'
import { mocked } from 'jest-mock'
import React from 'react'
import { render } from '@testing-library/react'

import Authenticated from '@components/auth'
import NotFound from './404'
import ServerErrorMessage from '@components/server-error-message'
import Themed from '@components/themed'

jest.mock('@aws-amplify/analytics')
jest.mock('@components/auth')
jest.mock('@components/server-error-message')
jest.mock('@components/themed')

describe('404 error page', () => {
  beforeAll(() => {
    mocked(Authenticated).mockImplementation(({ children, setTokenStatus }) => {
      setTokenStatus(undefined)
      return <>{children}</>
    })
    mocked(ServerErrorMessage).mockReturnValue(<></>)
    mocked(Themed).mockImplementation(({ children }) => <>{children}</>)
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { pathname: '' },
    })
  })

  beforeEach(() => {
    window.location.pathname = '/an-invalid-page'
  })

  test('expect rendering NotFound renders Authenticated', () => {
    render(<NotFound />)
    expect(mocked(Authenticated)).toHaveBeenCalledTimes(1)
  })

  test('expect rendering NotFound renders ServerErrorMessage', () => {
    const expectedTitle = '404: Not Found'
    render(<NotFound />)
    expect(mocked(ServerErrorMessage)).toHaveBeenCalledWith(
      expect.objectContaining({ title: expectedTitle }),
      expect.anything(),
    )
    expect(mocked(ServerErrorMessage)).toHaveBeenCalledTimes(1)
  })

  test('expect no render when path begins /c/', () => {
    window.location.pathname = '/c/aeiou'
    render(<NotFound />)
    expect(mocked(ServerErrorMessage)).toHaveBeenCalledTimes(0)
  })

  test('expect render when pathname has three slashes', () => {
    window.location.pathname = '/c/aeiou/y'
    render(<NotFound />)
    expect(mocked(ServerErrorMessage)).toHaveBeenCalledTimes(1)
  })

  test('expect no render when pathname is build /c/*/b/*', () => {
    window.location.pathname = '/c/aeiou/b/sometimesy'
    render(<NotFound />)
    expect(mocked(ServerErrorMessage)).toHaveBeenCalledTimes(0)
  })
})
