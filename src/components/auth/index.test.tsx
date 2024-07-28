import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { mocked } from 'jest-mock'
import React from 'react'

import * as auth from '@services/auth'
import * as buildMaker from '@services/build-maker'
import Authenticated from './index'
import { twitchAuthTokenStatus } from '@test/__mocks__'

jest.mock('@aws-amplify/analytics')
jest.mock('@services/auth')
jest.mock('@services/build-maker')

describe('Authenticated component', () => {
  const accessToken = 'tfvbjhgfr567uhghji987ytrdsdfgbn'
  const setTokenStatus = jest.fn()
  const windowLocationHash = `#access_token=${accessToken}`
  const windowLocationOrigin = 'http://localhost'
  const windowLocationPathname = '/index.html'
  const windowLocationReload = jest.fn()

  beforeAll(() => {
    console.error = jest.fn()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        hash: windowLocationHash,
        origin: windowLocationOrigin,
        pathname: windowLocationPathname,
        reload: windowLocationReload,
      },
    })

    mocked(auth).getAccessToken.mockReturnValue(accessToken)
    mocked(buildMaker).validateTwitchToken.mockResolvedValue(twitchAuthTokenStatus)
  })

  describe('signed out', () => {
    beforeAll(() => {
      mocked(auth).getAccessToken.mockReturnValue(null)
      window.location.hash = ''
    })

    test('expect sign in and children', async () => {
      render(
        <Authenticated setTokenStatus={setTokenStatus}>
          <p>Testing children</p>
        </Authenticated>,
      )

      expect(await screen.findByText(/Testing children/i)).toBeVisible()
      expect(await screen.findByText(/Sign In/i)).toBeVisible()
    })

    test('expect clicking sign in navigates to Twitch', async () => {
      render(
        <Authenticated setTokenStatus={setTokenStatus}>
          <p>Testing children</p>
        </Authenticated>,
      )
      const signInButton = (await screen.findByText(/Sign in/i, { selector: 'button' })) as HTMLButtonElement
      fireEvent.click(signInButton)

      expect(mocked(auth).initiateTwitchLogin).toHaveBeenCalled()
    })
  })

  describe('token', () => {
    beforeAll(() => {
      mocked(auth).getAccessToken.mockReturnValue(accessToken)
      window.location.hash = windowLocationHash
    })

    test('expect having a access token sets the token status', async () => {
      render(
        <Authenticated setTokenStatus={setTokenStatus}>
          <p>Testing children</p>
        </Authenticated>,
      )

      await waitFor(() => {
        expect(setTokenStatus).toHaveBeenCalled()
      })
      expect(await screen.findByText(/btse/i)).toBeVisible()
      expect(setTokenStatus).toHaveBeenCalledWith(twitchAuthTokenStatus)
    })

    test('expect invalid token shows an error message and refreshes with Twitch', async () => {
      mocked(buildMaker).validateTwitchToken.mockResolvedValueOnce({ ...twitchAuthTokenStatus, status: 'invalid' })
      render(
        <Authenticated setTokenStatus={setTokenStatus}>
          <p>Testing children</p>
        </Authenticated>,
      )

      await waitFor(() => {
        expect(mocked(auth).initiateTwitchLogin).toHaveBeenCalled()
      })
      expect(await screen.findByText(/Token has expired, refreshing token/i)).toBeVisible()
    })

    test('expect expired token logs user out and shows error message', async () => {
      mocked(buildMaker).validateTwitchToken.mockRejectedValueOnce(undefined)
      render(
        <Authenticated setTokenStatus={setTokenStatus}>
          <p>Testing children</p>
        </Authenticated>,
      )

      await waitFor(() => {
        expect(setTokenStatus).toHaveBeenCalledWith(undefined)
      })
      expect(await screen.findByText(/Problem verifying token. Refresh the page./i)).toBeVisible()
      expect(console.error).toHaveBeenCalled()
    })

    test('expect closing error message removes it', async () => {
      mocked(buildMaker).validateTwitchToken.mockRejectedValueOnce(undefined)
      render(
        <Authenticated setTokenStatus={setTokenStatus}>
          <p>Testing children</p>
        </Authenticated>,
      )

      await waitFor(() => {
        expect(screen.getByText(/Problem verifying token. Refresh the page./i)).toBeVisible()
      })
      const closeSnackbarButton = (await screen.findByLabelText(/Close/i, { selector: 'button' })) as HTMLButtonElement
      fireEvent.click(closeSnackbarButton)

      expect(await screen.queryByText(/Problem verifying token. Refresh the page./i)).not.toBeInTheDocument()
    })
  })

  describe('signed in', () => {
    beforeAll(() => {
      mocked(auth).getAccessToken.mockReturnValue(accessToken)
      window.location.hash = windowLocationHash
    })

    test('expect working menu', async () => {
      render(
        <Authenticated setTokenStatus={setTokenStatus}>
          <p>Testing children</p>
        </Authenticated>,
      )
      await waitFor(() => {
        expect(screen.getByLabelText(/menu/i, { selector: 'button' })).toBeVisible()
      })
      const menuButton = (await screen.findByLabelText(/menu/i, { selector: 'button' })) as HTMLButtonElement
      fireEvent.click(menuButton)

      expect(await screen.findByText(/Sign out/i)).toBeVisible()
      expect(await screen.findByText(/Close/i)).toBeVisible()
    })

    test('expect selecting sign out signs the user out', async () => {
      render(
        <Authenticated setTokenStatus={setTokenStatus}>
          <p>Testing children</p>
        </Authenticated>,
      )
      await waitFor(() => {
        expect(screen.queryByLabelText(/menu/i, { selector: 'button' })).toBeVisible()
      })
      const menuButton = (await screen.findByLabelText(/menu/i, { selector: 'button' })) as HTMLButtonElement
      fireEvent.click(menuButton)
      const signOutButton = (await screen.findByText(/Sign out/i)) as HTMLButtonElement
      fireEvent.click(signOutButton)

      await waitFor(() => {
        expect(windowLocationReload).toHaveBeenCalled()
      })
      expect(mocked(auth).removeAccessToken).toHaveBeenCalled()
    })

    test('expect closing menu closes the menu', async () => {
      render(
        <Authenticated setTokenStatus={setTokenStatus}>
          <p>Testing children</p>
        </Authenticated>,
      )
      await waitFor(() => {
        expect(screen.getByLabelText(/menu/i, { selector: 'button' })).toBeVisible()
      })
      const menuButton = (await screen.findByLabelText(/menu/i, { selector: 'button' })) as HTMLButtonElement
      fireEvent.click(menuButton)
      const closeButton = (await screen.findByText(/Close/i)) as HTMLButtonElement
      fireEvent.click(closeButton)

      await waitFor(() => {
        expect(screen.queryByText(/Sign out/i)).not.toBeVisible()
      })
    })
  })
})
