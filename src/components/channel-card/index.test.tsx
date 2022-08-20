import '@testing-library/jest-dom'
import { act, render, screen } from '@testing-library/react'
import React from 'react'
import { mocked } from 'jest-mock'

import * as buildMaker from '@services/build-maker'
import { buildBatch, channel, channelId } from '@test/__mocks__'
import ChannelCard from './index'

jest.mock('@aws-amplify/analytics')
jest.mock('@services/build-maker')
jest.mock('gatsby')

describe('ChannelCard component', () => {
  const consoleError = console.error

  beforeAll(() => {
    console.error = jest.fn()
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

      expect(await screen.findByText(/Error fetching build information, please refresh the page to try again/i)).toBeVisible()
      expect(console.error).toHaveBeenCalledTimes(1)
    })

    test('expect fetchChannel failure displays message', async () => {
      mocked(buildMaker).fetchChannel.mockRejectedValueOnce(undefined)
      render(<ChannelCard channelId={channelId} />)

      expect(await screen.findByText(/Error fetching channel information, please refresh the page to try again/i)).toBeVisible()
      expect(console.error).toHaveBeenCalledTimes(1)
    })

    test('expect closing error message snackbar removes it', async () => {
      mocked(buildMaker).fetchChannel.mockRejectedValueOnce(undefined)
      render(<ChannelCard channelId={channelId} />)

      const closeSnackbarButton = (await screen.findByLabelText(/Close/i, { selector: 'button' })) as HTMLButtonElement
      act(() => {
        closeSnackbarButton.click()
      })

      expect(screen.queryByText(/Error fetching channel information, please refresh the page to try again/i)).not.toBeInTheDocument()
    })
  })
})
