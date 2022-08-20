import '@testing-library/jest-dom'
import * as gatsby from 'gatsby'
import { mocked } from 'jest-mock'

import { getAccessToken, initiateTwitchLogin, removeAccessToken } from './auth'
import Cookies from 'universal-cookie'
import { twitchAuthToken } from '@test/__mocks__'

jest.mock('@aws-amplify/analytics')
jest.mock('gatsby')
jest.mock('universal-cookie')

describe('Auth service', () => {
  const mockCookieGet = jest.fn()
  const mockCookieRemove = jest.fn()
  const mockCookieSet = jest.fn()
  const windowLocationHash = `#access_token=${twitchAuthToken}`
  const windowLocationOrigin = 'http://localhost'

  beforeAll(() => {
    mocked(Cookies).mockImplementation(
      () =>
        ({
          get: mockCookieGet,
          remove: mockCookieRemove,
          set: mockCookieSet,
        } as unknown as Cookies)
    )
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { hash: windowLocationHash, origin: windowLocationOrigin },
    })
  })

  describe('getAccessToken', () => {
    beforeEach(() => {
      window.location.hash = windowLocationHash
    })

    test('expect hash access token returned and cookie set', () => {
      const result = getAccessToken()

      expect(mockCookieGet).toHaveBeenCalledWith('access_token')
      expect(mockCookieSet).toHaveBeenCalledWith('access_token', 'otfghjklkgtyuijnmk', {
        path: '/',
        sameSite: 'none',
        secure: true,
      })
      expect(result).toEqual(twitchAuthToken)
      expect(window.location.hash).toEqual('#')
    })

    test('expect cookie access token returned', () => {
      mockCookieGet.mockReturnValue(twitchAuthToken)
      const result = getAccessToken()

      expect(mockCookieGet).toHaveBeenCalledWith('access_token')
      expect(mockCookieSet).toHaveBeenCalledTimes(0)
      expect(result).toEqual(twitchAuthToken)
    })

    test('expect deleted token gets new token', () => {
      mockCookieGet.mockReturnValue(twitchAuthToken)
      const result = getAccessToken()

      expect(mockCookieGet).toHaveBeenCalledWith('access_token')
      expect(mockCookieSet).toHaveBeenCalledTimes(0)
      expect(result).toEqual(twitchAuthToken)
    })
  })

  describe('removeAccessToken', () => {
    test('expect cookie remove invoked', () => {
      removeAccessToken()
      expect(mockCookieRemove).toHaveBeenCalledWith('access_token')
    })
  })

  describe('initiateTwitchLogin', () => {
    test('expect Gatsby navigate is called to redirect back to current URL', () => {
      initiateTwitchLogin()

      expect(mocked(gatsby).navigate).toBeCalledWith(
        'https://id.twitch.tv/oauth2/authorize?response_type=token&client_id=jhgfrtyhjkjgyjh&redirect_uri=http%3A%2F%2Flocalhost&scope=moderation%3Aread'
      )
    })
  })
})
