import '@testing-library/jest-dom'
import { act, fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { mocked } from 'jest-mock'

import * as auth from '@services/auth'
import * as buildMaker from '@services/build-maker'
import { buildBatch, channel, channelId, twitchAuthToken, twitchAuthTokenStatus } from '@test/__mocks__'
import ChannelCard from './index'

jest.mock('@aws-amplify/analytics')
jest.mock('@services/auth')
jest.mock('@services/build-maker')
jest.mock('gatsby')

describe('ChannelCard component', () => {
  const consoleError = console.error

  beforeAll(() => {
    console.error = jest.fn()
    mocked(auth).getAccessToken.mockReturnValue(twitchAuthToken)
    mocked(buildMaker).fetchAllBuilds.mockResolvedValue(buildBatch)
    mocked(buildMaker).fetchChannel.mockResolvedValue(channel)
  })

  afterAll(() => {
    console.error = consoleError
  })

  describe('data load', () => {
    test('expect stats and name rendered', async () => {
      render(<ChannelCard channelId={channelId} />)

      expect(mocked(buildMaker).fetchAllBuilds).toHaveBeenCalledWith(channelId)
      expect(mocked(buildMaker).fetchChannel).toHaveBeenCalledWith(channelId)
      expect(await screen.findByText(/MyChannel/i)).toBeVisible()
      expect(await screen.findByText(/Pending builds: 1/i)).toBeVisible()
    })

    test("expect passing in initialBuilds doesn't invoke fetchAllBuilds", async () => {
      render(<ChannelCard channelId={channelId} initialBuilds={buildBatch} />)

      expect(await screen.findByText(/MyChannel/i)).toBeVisible()
      expect(await screen.findByText(/Pending builds: 1/i)).toBeVisible()
      expect(mocked(buildMaker).fetchAllBuilds).toHaveBeenCalledTimes(0)
    })

    test('expect fetchAllBuilds failure displays message', async () => {
      mocked(buildMaker).fetchAllBuilds.mockRejectedValueOnce(undefined)
      render(<ChannelCard channelId={channelId} />)

      expect(
        await screen.findByText(/Error fetching build information, please refresh the page to try again/i)
      ).toBeVisible()
      expect(console.error).toHaveBeenCalledTimes(1)
    })

    test('expect fetchChannel failure displays message', async () => {
      mocked(buildMaker).fetchChannel.mockRejectedValueOnce(undefined)
      render(<ChannelCard channelId={channelId} />)

      expect(
        await screen.findByText(/Error fetching channel information, please refresh the page to try again/i)
      ).toBeVisible()
      expect(console.error).toHaveBeenCalledTimes(1)
    })

    test('expect closing error message snackbar removes it', async () => {
      mocked(buildMaker).fetchChannel.mockRejectedValueOnce(undefined)
      render(<ChannelCard channelId={channelId} />)

      const closeSnackbarButton = (await screen.findByLabelText(/Close/i, { selector: 'button' })) as HTMLButtonElement
      act(() => {
        closeSnackbarButton.click()
      })

      expect(
        screen.queryByText(/Error fetching channel information, please refresh the page to try again/i)
      ).not.toBeInTheDocument()
    })
  })

  describe('channel notes', () => {
    const tokenForChannel = { ...twitchAuthTokenStatus, id: channelId }

    test('expect no edit button when no token', async () => {
      render(<ChannelCard channelId={channelId} />)
      expect(screen.queryByLabelText(/Edit restrictions/i)).not.toBeInTheDocument()
    })

    test("expect no edit button when token doesn't match channel", async () => {
      render(<ChannelCard channelId={channelId} tokenStatus={twitchAuthTokenStatus} />)
      expect(screen.queryByLabelText(/Edit restrictions/i)).not.toBeInTheDocument()
    })

    test('expect no edit button when no access token', async () => {
      mocked(auth).getAccessToken.mockReturnValueOnce(null)

      render(<ChannelCard channelId={channelId} tokenStatus={tokenForChannel} />)
      expect(screen.queryByLabelText(/Edit restrictions/i)).not.toBeInTheDocument()
    })

    test('expect editing restrictions invokes patchChannel', async () => {
      render(<ChannelCard channelId={channelId} tokenStatus={tokenForChannel} />)

      const editRestrictionsIcon = (await screen.findByLabelText(/Edit restrictions/i)) as HTMLImageElement
      act(() => {
        editRestrictionsIcon.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      })
      const restrictionsInput = (await screen.findByLabelText(/Build restrictions/i)) as HTMLInputElement
      act(() => {
        fireEvent.change(restrictionsInput, { target: { value: 'No nurse' } })
      })
      const submitRestrictionsIcon = (await screen.findByLabelText(/Submit restrictions/i)) as HTMLImageElement
      act(() => {
        submitRestrictionsIcon.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      })

      expect(mocked(buildMaker).patchChannel).toHaveBeenCalledWith(
        '123456',
        [
          { op: 'test', path: '/notes', value: 'No new perks' },
          { op: 'replace', path: '/notes', value: 'No nurse' },
        ],
        'otfghjklkgtyuijnmk'
      )
    })

    test('expect patchChannel invoked with undefined when no restrictions', async () => {
      render(<ChannelCard channelId={channelId} tokenStatus={tokenForChannel} />)

      const editRestrictionsIcon = (await screen.findByLabelText(/Edit restrictions/i)) as HTMLImageElement
      act(() => {
        editRestrictionsIcon.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      })
      const restrictionsInput = (await screen.findByLabelText(/Build restrictions/i)) as HTMLInputElement
      act(() => {
        fireEvent.change(restrictionsInput, { target: { value: '' } })
      })
      const submitRestrictionsIcon = (await screen.findByLabelText(/Submit restrictions/i)) as HTMLImageElement
      act(() => {
        submitRestrictionsIcon.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      })

      expect(mocked(buildMaker).patchChannel).toHaveBeenCalledWith(
        '123456',
        [
          { op: 'test', path: '/notes', value: 'No new perks' },
          { op: 'remove', path: '/notes' },
        ],
        'otfghjklkgtyuijnmk'
      )
    })

    test('expect patchChannel reject shows error message', async () => {
      mocked(buildMaker).fetchChannel.mockResolvedValueOnce({ ...channel, notes: undefined })
      mocked(buildMaker).patchChannel.mockRejectedValueOnce(undefined)
      render(<ChannelCard channelId={channelId} tokenStatus={tokenForChannel} />)

      const editRestrictionsIcon = (await screen.findByLabelText(/Edit restrictions/i)) as HTMLImageElement
      act(() => {
        editRestrictionsIcon.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      })
      const restrictionsInput = (await screen.findByLabelText(/Build restrictions/i)) as HTMLInputElement
      act(() => {
        fireEvent.change(restrictionsInput, { target: { value: 'No nurse' } })
      })
      const submitRestrictionsIcon = (await screen.findByLabelText(/Submit restrictions/i)) as HTMLImageElement
      act(() => {
        submitRestrictionsIcon.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      })

      expect(await screen.findByText(/Unable to save changes, please try again/i)).toBeVisible()
      expect(console.error).toHaveBeenCalledTimes(1)
    })
  })
})
