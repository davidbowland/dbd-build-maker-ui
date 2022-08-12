import '@testing-library/jest-dom'
import { act, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { mocked } from 'jest-mock'

import * as auth from '@services/auth'
import * as buildMaker from '@services/build-maker'
import { buildBatch, buildKiller, channel, channelId, twitchAuthToken, twitchAuthTokenStatus } from '@test/__mocks__'
import BuildList from './index'
import GenerateBuildUrl from '@components/generate-build-url'

jest.mock('@aws-amplify/analytics')
jest.mock('@components/generate-build-url')
jest.mock('@services/auth')
jest.mock('@services/build-maker')

describe('BuildList component', () => {
  const consoleError = console.error

  beforeAll(() => {
    console.error = jest.fn()
    mocked(auth).getAccessToken.mockReturnValue(twitchAuthToken)
    mocked(buildMaker).fetchAllBuilds.mockResolvedValue(buildBatch)
    mocked(buildMaker).fetchChannel.mockResolvedValue(channel)
    mocked(GenerateBuildUrl).mockReturnValue(<>GenerateBuildUrl</>)
  })

  afterAll(() => {
    console.error = consoleError
  })

  describe('builds', () => {
    test('expect builds to be shown', async () => {
      render(<BuildList channelId={channelId} tokenStatus={twitchAuthTokenStatus} />)

      expect(await screen.findByText(/Wraith/i)).toBeVisible()
      expect(await screen.findByText(/Jill Valentine/i)).toBeVisible()
    })

    test('expect no builds shown when no builds', async () => {
      mocked(buildMaker).fetchAllBuilds.mockResolvedValueOnce([])
      render(<BuildList channelId={channelId} tokenStatus={twitchAuthTokenStatus} />)

      expect(await screen.findByText(/No builds/i)).toBeVisible()
    })

    test('expect error message on fetch reject', async () => {
      mocked(buildMaker).fetchAllBuilds.mockRejectedValueOnce(undefined)
      render(<BuildList channelId={channelId} tokenStatus={twitchAuthTokenStatus} />)

      expect(await screen.findByText(/Error fetching build list/i)).toBeVisible()
      expect(console.error).toHaveBeenCalled()
    })

    test('expect closing error message removes it', async () => {
      mocked(buildMaker).fetchAllBuilds.mockRejectedValueOnce(undefined)
      render(<BuildList channelId={channelId} tokenStatus={twitchAuthTokenStatus} />)

      await screen.findByText(/Error fetching build list/i)
      const closeSnackbarButton = (await screen.findByLabelText(/Close/i, { selector: 'button' })) as HTMLButtonElement
      act(() => {
        closeSnackbarButton.click()
      })

      expect(screen.queryByText(/Error fetching build list/i)).not.toBeInTheDocument()
    })
  })

  describe('authorized', () => {
    const tokenForChannel = { ...twitchAuthTokenStatus, id: channelId, name: 'mod1' }

    test('expect GenerateBuildUrl shown', async () => {
      render(<BuildList channelId={channelId} tokenStatus={tokenForChannel} />)

      waitFor(() => {
        expect(mocked(GenerateBuildUrl)).toHaveBeenCalledTimes(1)
      })
    })

    test('expect marking build completed invokes patchBuild', async () => {
      const mockOperation = jest.fn()
      mocked(buildMaker).patchBuild.mockImplementationOnce(async (channel, build, operations) => {
        operations.map((value) => mockOperation(value))
        return buildKiller
      })
      render(<BuildList channelId={channelId} tokenStatus={tokenForChannel} />)

      const markCompleteButton = (await screen.findByText(/^Mark complete/i, {
        selector: 'button',
      })) as HTMLButtonElement
      await act(async () => {
        await markCompleteButton.click()
      })
      waitFor(() => {
        expect(mocked(buildMaker).patchBuild).toHaveBeenCalled()
      })
      expect(mocked(buildMaker).patchBuild).toHaveBeenCalledWith(
        channelId,
        'ytrfghjklkmnbvfty',
        expect.anything(),
        twitchAuthToken
      )
      expect(mockOperation).toHaveBeenCalledWith(expect.objectContaining({ op: 'add', path: '/completed' }))
      expect(screen.queryAllByText(/Unmark complete/i).length).toEqual(2)
    })

    test('expect unmarking build completed invokes patchBuild', async () => {
      const mockOperation = jest.fn()
      mocked(buildMaker).patchBuild.mockImplementationOnce(async (channel, build, operations) => {
        operations.map((value) => mockOperation(value))
        return buildKiller
      })
      render(<BuildList channelId={channelId} tokenStatus={tokenForChannel} />)

      const unmarkCompleteButton = (await screen.findByText(/Unmark complete/i, {
        selector: 'button',
      })) as HTMLButtonElement
      await act(async () => {
        await unmarkCompleteButton.click()
      })
      waitFor(() => {
        expect(mocked(buildMaker).patchBuild).toHaveBeenCalled()
      })
      expect(mocked(buildMaker).patchBuild).toHaveBeenCalledWith(
        channelId,
        'jhgfghj',
        expect.anything(),
        twitchAuthToken
      )
      expect(mockOperation).toHaveBeenCalledWith(expect.objectContaining({ op: 'test', path: '/completed' }))
      expect(mockOperation).toHaveBeenCalledWith(expect.objectContaining({ op: 'remove', path: '/completed' }))
      expect(screen.queryAllByText(/^Mark complete/i).length).toEqual(2)
    })

    test('expect patchBuild error shows error message', async () => {
      mocked(buildMaker).patchBuild.mockRejectedValueOnce(undefined)
      render(<BuildList channelId={channelId} tokenStatus={tokenForChannel} />)

      const markCompleteButton = (await screen.findByText(/^Mark complete/i, {
        selector: 'button',
      })) as HTMLButtonElement
      await act(async () => {
        await markCompleteButton.click()
      })
      waitFor(() => {
        expect(mocked(buildMaker).patchBuild).toHaveBeenCalled()
      })
      expect(await screen.findByText(/Error updating build/i)).toBeVisible()
      expect(console.error).toHaveBeenCalled()
    })

    test("expect no token doesn't call patchBuild", async () => {
      mocked(auth).getAccessToken.mockReturnValueOnce(null)
      render(<BuildList channelId={channelId} tokenStatus={tokenForChannel} />)

      mocked(auth).getAccessToken.mockReturnValueOnce(null)
      const markCompleteButton = (await screen.findByText(/^Mark complete/i, {
        selector: 'button',
      })) as HTMLButtonElement
      await act(async () => {
        await markCompleteButton.click()
      })
      expect(mocked(buildMaker).patchBuild).not.toHaveBeenCalled()
    })
  })

  describe('channel', () => {
    test('expect error fetching channel info displays error', async () => {
      mocked(buildMaker).fetchChannel.mockRejectedValueOnce(undefined)
      render(<BuildList channelId={channelId} tokenStatus={twitchAuthTokenStatus} />)

      expect(await screen.findByText(/Error fetching channel info/i)).toBeVisible()
      expect(console.error).toHaveBeenCalled()
    })

    test('expect closing error message removes it', async () => {
      mocked(buildMaker).fetchChannel.mockRejectedValueOnce(undefined)
      render(<BuildList channelId={channelId} tokenStatus={twitchAuthTokenStatus} />)

      await screen.findByText(/Error fetching channel info/i)
      const closeSnackbarButton = (await screen.findByLabelText(/Close/i, { selector: 'button' })) as HTMLButtonElement
      act(() => {
        closeSnackbarButton.click()
      })

      expect(screen.queryByText(/Error fetching channel info/i)).not.toBeInTheDocument()
    })
  })
})
