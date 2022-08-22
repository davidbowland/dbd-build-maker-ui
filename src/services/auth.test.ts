import '@testing-library/jest-dom'
import * as gatsby from 'gatsby'
import { mocked } from 'jest-mock'

import { getAccessToken, initiateTwitchLogin, redirectLogin, removeAccessToken } from './auth'
import Cookies from 'universal-cookie'
import { twitchAuthToken } from '@test/__mocks__'

jest.mock('@aws-amplify/analytics')
jest.mock('gatsby')
jest.mock('universal-cookie')

describe('Auth service', () => {
  const historyReplaceState = jest.spyOn(history, 'replaceState')
  const mockCookieGet = jest.fn()
  const mockCookieSet = jest.fn()
  const windowLocationHash = `#access_token=${twitchAuthToken}`
  const windowLocationOrigin = 'http://localhost'
  const windowLocationPathname = '/c/123456'

  beforeAll(() => {
    mocked(Cookies).mockImplementation(
      () =>
        ({
          get: mockCookieGet,
          set: mockCookieSet,
        } as unknown as Cookies)
    )
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { hash: windowLocationHash, origin: windowLocationOrigin, pathname: windowLocationPathname },
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
        sameSite: 'strict',
        secure: true,
      })
      expect(result).toEqual(twitchAuthToken)
      expect(historyReplaceState).toHaveBeenCalledWith(null, '', '/c/123456')
    })

    test('expect empty cookie set when no hash', () => {
      window.location.hash = '#'
      const result = getAccessToken()

      expect(mockCookieGet).toHaveBeenCalledWith('access_token')
      expect(mockCookieSet).toHaveBeenCalledWith('access_token', '', {
        path: '/',
        sameSite: 'strict',
        secure: true,
      })
      expect(result).toEqual(null)
      expect(window.location.hash).toEqual('#')
    })

    test('expect cookie access token returned', () => {
      mockCookieGet.mockReturnValueOnce(twitchAuthToken)
      const result = getAccessToken()

      expect(mockCookieGet).toHaveBeenCalledWith('access_token')
      expect(mockCookieSet).toHaveBeenCalledTimes(0)
      expect(result).toEqual(twitchAuthToken)
    })

    test('expect deleted token gets new token', () => {
      mockCookieGet.mockReturnValueOnce(twitchAuthToken)
      const result = getAccessToken()

      expect(mockCookieGet).toHaveBeenCalledWith('access_token')
      expect(mockCookieSet).toHaveBeenCalledTimes(0)
      expect(result).toEqual(twitchAuthToken)
    })
  })

  describe('removeAccessToken', () => {
    test('expect cookie set to empty string', () => {
      removeAccessToken()

      expect(mockCookieSet).toHaveBeenCalledWith('access_token', '', {
        path: '/',
        sameSite: 'strict',
        secure: true,
      })
    })
  })

  describe('initiateTwitchLogin', () => {
    test('expect Gatsby navigate is called to redirect back to current URL and cookie set', () => {
      initiateTwitchLogin()

      expect(mockCookieGet).toHaveBeenCalledWith('return_url')
      expect(mocked(gatsby).navigate).toHaveBeenCalledWith(
        'https://id.twitch.tv/oauth2/authorize?response_type=token&client_id=jhgfrtyhjkjgyjh&redirect_uri=http%3A%2F%2Flocalhost&scope=moderation%3Aread'
      )
      expect(mockCookieSet).toHaveBeenCalledWith('return_url', '/c/123456', {
        path: '/',
        sameSite: 'strict',
        secure: true,
      })
      expect(mockCookieSet).toHaveBeenCalledWith('access_token', '', {
        path: '/',
        sameSite: 'strict',
        secure: true,
      })
    })

    test('expect cookie not set when it already exists', () => {
      mockCookieGet.mockReturnValueOnce('/something')
      initiateTwitchLogin()

      expect(mockCookieGet).toHaveBeenCalledWith('return_url')
      expect(mocked(gatsby).navigate).toHaveBeenCalledWith(
        'https://id.twitch.tv/oauth2/authorize?response_type=token&client_id=jhgfrtyhjkjgyjh&redirect_uri=http%3A%2F%2Flocalhost&scope=moderation%3Aread'
      )
      expect(mockCookieSet).not.toHaveBeenCalledWith('return_url', expect.anything(), expect.anything())
    })
  })

  describe('redirectLogin', () => {
    test('expect redirect when cookie present', () => {
      mockCookieGet.mockReturnValueOnce(windowLocationPathname)
      redirectLogin()

      expect(mockCookieGet).toHaveBeenCalledWith('return_url')
      expect(mockCookieSet).toHaveBeenCalledWith('return_url', '', {
        path: '/',
        sameSite: 'strict',
        secure: true,
      })
      expect(mocked(gatsby).navigate).toHaveBeenCalledWith('/c/123456')
    })

    test('expect no redirect when no cookie present', () => {
      redirectLogin()

      expect(mockCookieGet).toHaveBeenCalledWith('return_url')
      expect(mocked(gatsby).navigate).toHaveBeenCalledTimes(0)
    })
  })
})
