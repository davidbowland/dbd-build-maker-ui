import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { mocked } from 'jest-mock'
import React from 'react'

import * as buildMaker from '@services/build-maker'
import * as gatsby from 'gatsby'
import { buildToken, channelId, submitter, twitchAuthToken } from '@test/__mocks__'
import GenerateBuildUrl from './index'

jest.mock('@aws-amplify/analytics')
jest.mock('@services/build-maker')
jest.mock('gatsby')

describe('GenerateBuildUrl component', () => {
  const buildPath = '/c/123456/b/ytrfghjklkmnbvfty'
  const buildUrl = `http://localhost${buildPath}`
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

  describe('token', () => {
    test('expect token URL generated when requested', async () => {
      render(<GenerateBuildUrl accessToken={twitchAuthToken} channelId={channelId} />)

      const generateTokenButton = (await screen.findByLabelText(/Create new build/i, {
        selector: 'button',
      })) as HTMLButtonElement
      fireEvent.click(generateTokenButton)
      const submitterInput = (await screen.findByLabelText(/Name of Requestor/i)) as HTMLInputElement
      fireEvent.change(submitterInput, { target: { value: submitter } })
      const generateButton = (await screen.findByText(/Generate build URL/i, {
        selector: 'button',
      })) as HTMLButtonElement
      fireEvent.click(generateButton)

      expect(mocked(buildMaker).createBuildToken).toHaveBeenCalledWith('123456', 'otfghjklkgtyuijnmk', 'cfb')
      expect(((await screen.findByLabelText(/Build URL/i, { selector: 'input' })) as HTMLInputElement).value).toEqual(
        buildUrl,
      )
    })

    test('expect redirect happens when manual build entry', async () => {
      render(<GenerateBuildUrl accessToken={twitchAuthToken} channelId={channelId} />)

      const generateTokenButton = (await screen.findByLabelText(/Create new build/i, {
        selector: 'button',
      })) as HTMLButtonElement
      fireEvent.click(generateTokenButton)
      const submitterInput = (await screen.findByLabelText(/Name of Requestor/i)) as HTMLInputElement
      fireEvent.change(submitterInput, { target: { value: submitter } })
      const manualBuildButton = (await screen.findByText(/Enter build yourself/i, {
        selector: 'button',
      })) as HTMLButtonElement
      fireEvent.click(manualBuildButton)

      await waitFor(() => {
        expect(mocked(gatsby).navigate).toHaveBeenCalled()
      })
      expect(mocked(buildMaker).createBuildToken).toHaveBeenCalledWith('123456', 'otfghjklkgtyuijnmk', 'cfb')
      expect(mocked(gatsby).navigate).toHaveBeenCalledWith(buildPath)
    })

    test('expect error message when no requestor', async () => {
      render(<GenerateBuildUrl accessToken={twitchAuthToken} channelId={channelId} />)

      const generateTokenButton = (await screen.findByLabelText(/Create new build/i, {
        selector: 'button',
      })) as HTMLButtonElement
      fireEvent.click(generateTokenButton)
      const generateButton = (await screen.findByText(/Generate build URL/i, {
        selector: 'button',
      })) as HTMLButtonElement
      fireEvent.click(generateButton)

      expect(await screen.findByText(/Requestor name is required/i)).toBeVisible()
    })

    test('expect error when createBuildToken rejects', async () => {
      mocked(buildMaker).createBuildToken.mockRejectedValueOnce(undefined)
      render(<GenerateBuildUrl accessToken={twitchAuthToken} channelId={channelId} />)

      const generateTokenButton = (await screen.findByLabelText(/Create new build/i, {
        selector: 'button',
      })) as HTMLButtonElement
      fireEvent.click(generateTokenButton)
      const submitterInput = (await screen.findByLabelText(/Name of Requestor/i)) as HTMLInputElement
      fireEvent.change(submitterInput, { target: { value: submitter } })
      const generateButton = (await screen.findByText(/Generate build URL/i, {
        selector: 'button',
      })) as HTMLButtonElement
      fireEvent.click(generateButton)

      expect(mocked(buildMaker).createBuildToken).toHaveBeenCalled()
      await waitFor(() => {
        expect(screen.queryByText(/Error generating build URL/i)).toBeVisible()
      })
    })

    test('expect closing error removes it', async () => {
      mocked(buildMaker).createBuildToken.mockRejectedValueOnce(undefined)
      render(<GenerateBuildUrl accessToken={twitchAuthToken} channelId={channelId} />)

      const generateTokenButton = (await screen.findByLabelText(/Create new build/i, {
        selector: 'button',
      })) as HTMLButtonElement
      fireEvent.click(generateTokenButton)
      const submitterInput = (await screen.findByLabelText(/Name of Requestor/i)) as HTMLInputElement
      fireEvent.change(submitterInput, { target: { value: submitter } })
      const generateButton = (await screen.findByText(/Generate build URL/i, {
        selector: 'button',
      })) as HTMLButtonElement
      fireEvent.click(generateButton)
      const closeSnackbarButton = (await screen.findByLabelText(/Close/i, { selector: 'button' })) as HTMLButtonElement
      fireEvent.click(closeSnackbarButton)

      expect(screen.queryByText(/Error generating build URL/i)).not.toBeInTheDocument()
    })

    test('expect dialog closes on escape', async () => {
      render(<GenerateBuildUrl accessToken={twitchAuthToken} channelId={channelId} />)

      const generateTokenButton = (await screen.findByLabelText(/Create new build/i, {
        selector: 'button',
      })) as HTMLButtonElement
      fireEvent.click(generateTokenButton)
      const dialog = (await screen.findByText(/Create new build/i)) as HTMLBodyElement
      fireEvent.keyDown(dialog, {
        code: 'Escape',
        key: 'Escape',
      })

      await waitFor(() => {
        expect(screen.queryByText(/Build URL/i)).not.toBeInTheDocument()
      })
    })

    test("expect dialog won't close while loading", async () => {
      mocked(buildMaker).createBuildToken.mockReturnValueOnce(new Promise(() => undefined))
      render(<GenerateBuildUrl accessToken={twitchAuthToken} channelId={channelId} />)

      const generateTokenButton = (await screen.findByLabelText(/Create new build/i, {
        selector: 'button',
      })) as HTMLButtonElement
      fireEvent.click(generateTokenButton)
      const submitterInput = (await screen.findByLabelText(/Name of Requestor/i)) as HTMLInputElement
      fireEvent.change(submitterInput, { target: { value: submitter } })
      const generateButton = (await screen.findByText(/Generate build URL/i, {
        selector: 'button',
      })) as HTMLButtonElement
      fireEvent.click(generateButton)
      const dialog = (await screen.findByText(/Create new build/i)) as HTMLBodyElement
      fireEvent.keyDown(dialog, {
        code: 'Escape',
        key: 'Escape',
      })

      expect(screen.queryByLabelText(/Generate build URL/i, { selector: 'button' })).not.toBeInTheDocument()
    })
  })

  describe('clipboard', () => {
    test('expect clicking copy to clipboard copies to clipboard', async () => {
      render(<GenerateBuildUrl accessToken={twitchAuthToken} channelId={channelId} />)

      const generateTokenButton = (await screen.findByLabelText(/Create new build/i, {
        selector: 'button',
      })) as HTMLButtonElement
      fireEvent.click(generateTokenButton)
      const submitterInput = (await screen.findByLabelText(/Name of Requestor/i)) as HTMLInputElement
      fireEvent.change(submitterInput, { target: { value: submitter } })
      const generateButton = (await screen.findByText(/Generate build URL/i, {
        selector: 'button',
      })) as HTMLButtonElement
      fireEvent.click(generateButton)
      const copyToClipboardButton = (await screen.findByText(/Copy build URL/i, {
        selector: 'button',
      })) as HTMLButtonElement
      fireEvent.click(copyToClipboardButton)

      expect(mockCopyToClipboard).toHaveBeenCalledWith(buildUrl)
      expect(screen.queryByText(/Link copied to clipboard/i)).toBeVisible()
    })

    test('expect closing success message removes it', async () => {
      render(<GenerateBuildUrl accessToken={twitchAuthToken} channelId={channelId} />)

      const generateTokenButton = (await screen.findByLabelText(/Create new build/i, {
        selector: 'button',
      })) as HTMLButtonElement
      fireEvent.click(generateTokenButton)
      const submitterInput = (await screen.findByLabelText(/Name of Requestor/i)) as HTMLInputElement
      fireEvent.change(submitterInput, { target: { value: submitter } })
      const generateButton = (await screen.findByText(/Generate build URL/i, {
        selector: 'button',
      })) as HTMLButtonElement
      fireEvent.click(generateButton)
      const copyToClipboardButton = (await screen.findByText(/Copy build URL/i, {
        selector: 'button',
      })) as HTMLButtonElement
      fireEvent.click(copyToClipboardButton)
      const closeSnackbarButton = (await screen.findByLabelText(/Close/i, { selector: 'button' })) as HTMLButtonElement
      fireEvent.click(closeSnackbarButton)

      expect(screen.queryByText(/Link copied to clipboard/i)).not.toBeInTheDocument()
    })

    test('expect copy error shows error message', async () => {
      mockCopyToClipboard.mockImplementationOnce(() => {
        throw new Error(undefined)
      })
      render(<GenerateBuildUrl accessToken={twitchAuthToken} channelId={channelId} />)

      const generateTokenButton = (await screen.findByLabelText(/Create new build/i, {
        selector: 'button',
      })) as HTMLButtonElement
      fireEvent.click(generateTokenButton)
      const submitterInput = (await screen.findByLabelText(/Name of Requestor/i)) as HTMLInputElement
      fireEvent.change(submitterInput, { target: { value: submitter } })
      const generateButton = (await screen.findByText(/Generate build URL/i, {
        selector: 'button',
      })) as HTMLButtonElement
      fireEvent.click(generateButton)
      const copyToClipboardButton = (await screen.findByText(/Copy build URL/i, {
        selector: 'button',
      })) as HTMLButtonElement
      fireEvent.click(copyToClipboardButton)

      expect(await screen.findByText(/Could not copy link to clipboard/i)).toBeVisible()
    })
  })
})
