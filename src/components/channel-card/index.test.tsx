import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { mocked } from 'jest-mock'
import React from 'react'

import * as auth from '@services/auth'
import * as buildMaker from '@services/build-maker'
import { channel, channelId, twitchAuthToken, twitchAuthTokenStatus } from '@test/__mocks__'
import ChannelCard from './index'

jest.mock('@aws-amplify/analytics')
jest.mock('@services/auth')
jest.mock('@services/build-maker')
jest.mock('gatsby')

describe('ChannelCard component', () => {
  beforeAll(() => {
    console.error = jest.fn()
    mocked(auth).getAccessToken.mockReturnValue(twitchAuthToken)
    mocked(buildMaker).fetchChannel.mockResolvedValue(channel)
  })

  describe('data load', () => {
    test('expect stats and name rendered', async () => {
      render(<ChannelCard channelId={channelId} />)

      expect(mocked(buildMaker).fetchChannel).toHaveBeenCalledWith(channelId)
      expect(await screen.findByText(/MyChannel/i)).toBeVisible()
      expect(await screen.findByText(/Pending builds: 2/i)).toBeVisible()
      expect(await screen.findByText(/Completed builds: 1/i)).toBeVisible()
    })

    test('expect fetchChannel failure displays message', async () => {
      mocked(buildMaker).fetchChannel.mockRejectedValueOnce(undefined)
      render(<ChannelCard channelId={channelId} />)

      expect(
        await screen.findByText(/Error fetching channel details, please refresh the page to try again/i),
      ).toBeVisible()
      expect(console.error).toHaveBeenCalledTimes(1)
    })

    test('expect closing error message snackbar removes it', async () => {
      mocked(buildMaker).fetchChannel.mockRejectedValueOnce(undefined)
      render(<ChannelCard channelId={channelId} />)

      const closeSnackbarButton = (await screen.findByLabelText(/Close/i, { selector: 'button' })) as HTMLButtonElement
      fireEvent.click(closeSnackbarButton)

      expect(
        screen.queryByText(/Error fetching channel details, please refresh the page to try again/i),
      ).not.toBeInTheDocument()
    })
  })

  describe('channel notes', () => {
    const tokenForChannel = { ...twitchAuthTokenStatus, id: channelId }

    test('expect no edit button when no token', async () => {
      render(<ChannelCard channelId={channelId} />)
      expect(screen.queryByLabelText(/Edit instructions/i)).not.toBeInTheDocument()
    })

    test("expect no edit button when token doesn't match channel", async () => {
      render(<ChannelCard channelId={channelId} tokenStatus={twitchAuthTokenStatus} />)
      expect(screen.queryByLabelText(/Edit instructions/i)).not.toBeInTheDocument()
    })

    test('expect no edit button when no access token', async () => {
      mocked(auth).getAccessToken.mockReturnValueOnce(null)

      render(<ChannelCard channelId={channelId} tokenStatus={tokenForChannel} />)
      expect(screen.queryByLabelText(/Edit instructions/i)).not.toBeInTheDocument()
    })

    test('expect no edit button when no message and not mod', async () => {
      mocked(buildMaker).fetchChannel.mockResolvedValueOnce({
        ...channel,
        notes: undefined,
      })

      render(<ChannelCard channelId={channelId} />)
      expect(await screen.findByText(/MyChannel/i)).toBeVisible()
      expect(screen.queryByLabelText(/Edit instructions/i)).not.toBeInTheDocument()
    })

    test('expect editing restrictions invokes patchChannel', async () => {
      render(<ChannelCard channelId={channelId} tokenStatus={tokenForChannel} />)

      const editRestrictionsIcon = (await screen.findByLabelText(/Edit instructions/i)) as HTMLImageElement
      fireEvent.click(editRestrictionsIcon)
      const restrictionsInput = (await screen.findByLabelText(/Special instructions/i)) as HTMLInputElement
      fireEvent.change(restrictionsInput, { target: { value: 'No nurse' } })
      const submitRestrictionsIcon = (await screen.findByLabelText(/Submit/i)) as HTMLImageElement
      fireEvent.click(submitRestrictionsIcon)

      expect(mocked(buildMaker).patchChannel).toHaveBeenCalledWith(
        '123456',
        [
          { op: 'test', path: '/notes', value: 'No new perks' },
          { op: 'replace', path: '/notes', value: 'No nurse' },
        ],
        'otfghjklkgtyuijnmk',
      )
    })

    test('expect patchChannel invoked with undefined when no restrictions', async () => {
      render(<ChannelCard channelId={channelId} tokenStatus={tokenForChannel} />)

      const editRestrictionsIcon = (await screen.findByLabelText(/Edit instructions/i)) as HTMLImageElement
      fireEvent.click(editRestrictionsIcon)
      const restrictionsInput = (await screen.findByLabelText(/Special instructions/i)) as HTMLInputElement
      fireEvent.change(restrictionsInput, { target: { value: '' } })
      const submitRestrictionsIcon = (await screen.findByLabelText(/Submit/i)) as HTMLImageElement
      fireEvent.click(submitRestrictionsIcon)

      expect(mocked(buildMaker).patchChannel).toHaveBeenCalledWith(
        '123456',
        [
          { op: 'test', path: '/notes', value: 'No new perks' },
          { op: 'remove', path: '/notes' },
        ],
        'otfghjklkgtyuijnmk',
      )
    })

    test('expect patchChannel reject shows error message', async () => {
      mocked(buildMaker).fetchChannel.mockResolvedValueOnce({ ...channel, notes: undefined })
      mocked(buildMaker).patchChannel.mockRejectedValueOnce(undefined)
      render(<ChannelCard channelId={channelId} tokenStatus={tokenForChannel} />)

      const editRestrictionsIcon = (await screen.findByLabelText(/Edit instructions/i)) as HTMLImageElement
      fireEvent.click(editRestrictionsIcon)
      const restrictionsInput = (await screen.findByLabelText(/Special instructions/i)) as HTMLInputElement
      fireEvent.change(restrictionsInput, { target: { value: 'No nurse' } })
      const submitRestrictionsIcon = (await screen.findByLabelText(/Submit/i)) as HTMLImageElement
      fireEvent.click(submitRestrictionsIcon)

      expect(await screen.findByText(/Unable to save changes, please reload the page and try again/i)).toBeVisible()
      expect(console.error).toHaveBeenCalledTimes(1)
    })
  })
})
