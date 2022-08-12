import '@testing-library/jest-dom'
import { act, fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { mocked } from 'jest-mock'

import * as buildMaker from '@services/build-maker'
import { buildToken, channelId, submitter, twitchAuthToken } from '@test/__mocks__'
import GenerateBuildUrl from './index'

jest.mock('@aws-amplify/analytics')
jest.mock('@services/build-maker')

describe('GenerateBuildUrl component', () => {
  const buildUrl = 'http://localhost/c/123456/b/ytrfghjklkmnbvfty'
  const consoleError = console.error
  const mockCopyToClipboard = jest.fn()

  beforeAll(() => {
    mocked(buildMaker).createBuildToken.mockResolvedValue(buildToken)

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: mockCopyToClipboard },
    })
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { origin: 'http://localhost' },
    })
    console.error = jest.fn()
  })

  afterAll(() => {
    console.error = consoleError
  })

  describe('token', () => {
    test('expect token URL generated when button clicked', async () => {
      render(<GenerateBuildUrl accessToken={twitchAuthToken} channelId={channelId} />)

      const submitterInput = (await screen.findByLabelText(/Name of Requestor/i)) as HTMLInputElement
      await act(() => {
        fireEvent.change(submitterInput, { target: { value: submitter } })
      })
      const generateTokenButton = (await screen.findByText(/Generate new build URL/i, {
        selector: 'button',
      })) as HTMLButtonElement
      await act(() => {
        generateTokenButton.click()
      })

      expect(mocked(buildMaker).createBuildToken).toHaveBeenCalledWith('123456', 'otfghjklkgtyuijnmk', 'cfb')
      expect(((await screen.findByLabelText(/Build URL/i)) as HTMLInputElement).value).toEqual(buildUrl)
    })

    test('expect error message when no requestor', async () => {
      render(<GenerateBuildUrl accessToken={twitchAuthToken} channelId={channelId} />)

      const generateTokenButton = (await screen.findByText(/Generate new build URL/i, {
        selector: 'button',
      })) as HTMLButtonElement
      await act(() => {
        generateTokenButton.click()
      })

      expect(await screen.findByText(/Requestor name is required/i)).toBeVisible()
    })

    test('expect error when createBuildToken rejects', async () => {
      mocked(buildMaker).createBuildToken.mockRejectedValueOnce(undefined)
      render(<GenerateBuildUrl accessToken={twitchAuthToken} channelId={channelId} />)

      const submitterInput = (await screen.findByLabelText(/Name of Requestor/i)) as HTMLInputElement
      await act(() => {
        fireEvent.change(submitterInput, { target: { value: submitter } })
      })
      const generateTokenButton = (await screen.findByText(/Generate new build URL/i, {
        selector: 'button',
      })) as HTMLButtonElement
      await act(() => {
        generateTokenButton.click()
      })

      expect(screen.queryByText(/Error generating build URL/i)).toBeVisible()
    })

    test('expect closing error removes it', async () => {
      mocked(buildMaker).createBuildToken.mockRejectedValueOnce(undefined)
      render(<GenerateBuildUrl accessToken={twitchAuthToken} channelId={channelId} />)

      const submitterInput = (await screen.findByLabelText(/Name of Requestor/i)) as HTMLInputElement
      await act(() => {
        fireEvent.change(submitterInput, { target: { value: submitter } })
      })
      const generateTokenButton = (await screen.findByText(/Generate new build URL/i, {
        selector: 'button',
      })) as HTMLButtonElement
      await act(() => {
        generateTokenButton.click()
      })
      const closeSnackbarButton = (await screen.findByLabelText(/Close/i, { selector: 'button' })) as HTMLButtonElement
      act(() => {
        closeSnackbarButton.click()
      })

      expect(screen.queryByText(/Error generating build URL/i)).not.toBeInTheDocument()
    })
  })

  describe('clipboard', () => {
    test('expect clicking copy to clipboard copies to clipboard', async () => {
      render(<GenerateBuildUrl accessToken={twitchAuthToken} channelId={channelId} />)

      const submitterInput = (await screen.findByLabelText(/Name of Requestor/i)) as HTMLInputElement
      await act(() => {
        fireEvent.change(submitterInput, { target: { value: submitter } })
      })
      const generateTokenButton = (await screen.findByText(/Generate new build URL/i, {
        selector: 'button',
      })) as HTMLButtonElement
      await act(() => {
        generateTokenButton.click()
      })
      const copyToClipboardButton = (await screen.findByText(/Copy build URL/i, {
        selector: 'button',
      })) as HTMLButtonElement
      act(() => {
        copyToClipboardButton.click()
      })

      expect(mockCopyToClipboard).toHaveBeenCalledWith(buildUrl)
      expect(screen.queryByText(/Link copied to clipboard/i)).toBeVisible()
    })

    test('expect closing success message removes it', async () => {
      render(<GenerateBuildUrl accessToken={twitchAuthToken} channelId={channelId} />)

      const submitterInput = (await screen.findByLabelText(/Name of Requestor/i)) as HTMLInputElement
      await act(() => {
        fireEvent.change(submitterInput, { target: { value: submitter } })
      })
      const generateTokenButton = (await screen.findByText(/Generate new build URL/i, {
        selector: 'button',
      })) as HTMLButtonElement
      await act(() => {
        generateTokenButton.click()
      })
      const copyToClipboardButton = (await screen.findByText(/Copy build URL/i, {
        selector: 'button',
      })) as HTMLButtonElement
      act(() => {
        copyToClipboardButton.click()
      })
      const closeSnackbarButton = (await screen.findByLabelText(/Close/i, { selector: 'button' })) as HTMLButtonElement
      act(() => {
        closeSnackbarButton.click()
      })

      expect(screen.queryByText(/Link copied to clipboard/i)).not.toBeInTheDocument()
    })

    test('expect copy error shows error message', async () => {
      mockCopyToClipboard.mockImplementationOnce(() => {
        throw new Error(undefined)
      })
      render(<GenerateBuildUrl accessToken={twitchAuthToken} channelId={channelId} />)

      const submitterInput = (await screen.findByLabelText(/Name of Requestor/i)) as HTMLInputElement
      await act(() => {
        fireEvent.change(submitterInput, { target: { value: submitter } })
      })
      const generateTokenButton = (await screen.findByText(/Generate new build URL/i, {
        selector: 'button',
      })) as HTMLButtonElement
      await act(() => {
        generateTokenButton.click()
      })
      const copyToClipboardButton = (await screen.findByText(/Copy build URL/i, {
        selector: 'button',
      })) as HTMLButtonElement
      act(() => {
        copyToClipboardButton.click()
      })

      expect(screen.queryByText(/Could not copy link to clipboard/i)).toBeVisible()
    })
  })
})
