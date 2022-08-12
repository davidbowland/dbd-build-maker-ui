import '@testing-library/jest-dom'
import * as gatsby from 'gatsby'
import { mocked } from 'jest-mock'

import { getAccessToken, initiateTwitchLogin } from './auth'
import { twitchAuthToken } from '@test/__mocks__'

jest.mock('@aws-amplify/analytics')
jest.mock('gatsby')

describe('Auth service', () => {
  const windowLocationHash = `#access_token=${twitchAuthToken}`
  const windowLocationOrigin = 'http://localhost'

  beforeAll(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { hash: windowLocationHash, origin: windowLocationOrigin },
    })
  })

  describe('getAccessToken', () => {
    beforeEach(() => {
      window.location.hash = windowLocationHash
    })

    test('expect access token returned', () => {
      const result = getAccessToken()
      expect(result).toEqual(twitchAuthToken)
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
