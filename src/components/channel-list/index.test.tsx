import '@testing-library/jest-dom'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { mocked } from 'jest-mock'

import * as auth from '@services/auth'
import * as buildMaker from '@services/build-maker'
import * as gatsby from 'gatsby'
import { channelBatch, channelId, twitchAuthToken, twitchAuthTokenStatus } from '@test/__mocks__'
import ChannelList from './index'
import SignUpCta from '@components/sign-up-cta'

jest.mock('@aws-amplify/analytics')
jest.mock('@components/sign-up-cta')
jest.mock('@services/auth')
jest.mock('@services/build-maker')
jest.mock('gatsby')

describe('ChannelList component', () => {
  const consoleError = console.error
  const tokenForChannel = { ...twitchAuthTokenStatus, id: channelId }
  const windowLocationReload = jest.fn()

  beforeAll(() => {
    console.error = jest.fn()
    mocked(SignUpCta).mockReturnValue(<></>)
    mocked(auth).getAccessToken.mockReturnValue(twitchAuthToken)
    mocked(buildMaker).fetchAllChannels.mockResolvedValue(channelBatch)

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { reload: windowLocationReload },
    })
  })

  afterAll(() => {
    console.error = consoleError
  })

  describe('channels', () => {
    test('expect channels to be shown', async () => {
      render(<ChannelList tokenStatus={twitchAuthTokenStatus} />)

      expect(await screen.findByText(/MyChannel/i)).toBeVisible()
      expect(await screen.findByText(/Pending builds: 2/i)).toBeVisible()
      expect(await screen.findByText(/Completed builds: 1/i)).toBeVisible()
    })

    test('expect clicking channel navigates', async () => {
      render(<ChannelList tokenStatus={twitchAuthTokenStatus} />)

      const card = await screen.findByText(/MyChannel/i)
      act(() => {
        card.click()
      })

      expect(mocked(gatsby).navigate).toHaveBeenCalledWith('/c/123456')
    })

    test('expect error message on fetch reject', async () => {
      mocked(buildMaker).fetchAllChannels.mockRejectedValueOnce(undefined)
      render(<ChannelList tokenStatus={twitchAuthTokenStatus} />)

      expect(await screen.findByText(/Error fetching channel list/i)).toBeVisible()
      expect(console.error).toHaveBeenCalled()
    })

    test('expect closing error message removes it', async () => {
      mocked(buildMaker).fetchAllChannels.mockRejectedValueOnce(undefined)
      render(<ChannelList tokenStatus={twitchAuthTokenStatus} />)

      const closeSnackbarButton = (await screen.findByLabelText(/Close/i, { selector: 'button' })) as HTMLButtonElement
      act(() => {
        closeSnackbarButton.click()
      })

      expect(screen.queryByText(/Error fetching channel list/i)).not.toBeInTheDocument()
    })
  })

  describe('channel sorting', () => {
    test('expect sorting alphabetically shows channel', async () => {
      render(<ChannelList tokenStatus={twitchAuthTokenStatus} />)

      const sortInput = (await screen.findByTestId(/channel-sort/i)) as HTMLInputElement
      act(() => {
        fireEvent.change(sortInput, { target: { value: 'alpha' } })
      })

      expect(await screen.findByText(/MyChannel/i)).toBeVisible()
      expect(await screen.findByText(/Pending builds: 2/i)).toBeVisible()
      expect(await screen.findByText(/Completed builds: 1/i)).toBeVisible()
    })

    test('expect sorting by build count shows channel', async () => {
      render(<ChannelList tokenStatus={twitchAuthTokenStatus} />)

      const sortInput = (await screen.findByTestId(/channel-sort/i)) as HTMLInputElement
      act(() => {
        fireEvent.change(sortInput, { target: { value: 'builds' } })
      })

      expect(await screen.findByText(/MyChannel/i)).toBeVisible()
      expect(await screen.findByText(/Pending builds: 2/i)).toBeVisible()
      expect(await screen.findByText(/Completed builds: 1/i)).toBeVisible()
    })

    test('expect sorting by recent activity shows channel', async () => {
      render(<ChannelList tokenStatus={twitchAuthTokenStatus} />)

      const sortInput = (await screen.findByTestId(/channel-sort/i)) as HTMLInputElement
      act(() => {
        fireEvent.change(sortInput, { target: { value: 'recent' } })
      })

      expect(await screen.findByText(/MyChannel/i)).toBeVisible()
      expect(await screen.findByText(/Pending builds: 2/i)).toBeVisible()
      expect(await screen.findByText(/Completed builds: 1/i)).toBeVisible()
    })
  })

  describe('channel filter', () => {
    test('expect channel filter to remove channel', async () => {
      render(<ChannelList tokenStatus={twitchAuthTokenStatus} />)

      await screen.findByText(/MyChannel/i)
      const filterInput = (await screen.findByLabelText(/Search channels/i)) as HTMLInputElement
      act(() => {
        fireEvent.change(filterInput, { target: { value: 'fnord' } })
      })

      expect(screen.queryByText(/MyChannel/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/Pending builds: 2/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/Completed builds: 1/i)).not.toBeInTheDocument()
    })
  })

  describe('create button', () => {
    test('expect channel created when create button clicked', async () => {
      render(<ChannelList tokenStatus={twitchAuthTokenStatus} />)
      const createChannelButton = (await screen.findByText(/Register your channel/i, {
        selector: 'button',
      })) as HTMLButtonElement
      await act(() => {
        createChannelButton.click()
      })
      const continueButton = (await screen.findByText(/Continue/i, {
        selector: 'button',
      })) as HTMLButtonElement
      await act(() => {
        continueButton.click()
      })

      waitFor(() => {
        expect(mocked(buildMaker).createChannel).toHaveBeenCalledWith(twitchAuthToken)
      })
      expect(windowLocationReload).toHaveBeenCalled()
    })

    test("expect cancelling channel creation doesn't invoke createChannel", async () => {
      render(<ChannelList tokenStatus={twitchAuthTokenStatus} />)
      const createChannelButton = (await screen.findByText(/Register your channel/i, {
        selector: 'button',
      })) as HTMLButtonElement
      await act(() => {
        createChannelButton.click()
      })
      const cancelButton = (await screen.findByText(/Cancel/i, {
        selector: 'button',
      })) as HTMLButtonElement
      await act(() => {
        cancelButton.click()
      })

      expect(mocked(buildMaker).createChannel).not.toHaveBeenCalled()
      expect(windowLocationReload).not.toHaveBeenCalled()
    })

    test('expect error when channel creation fails', async () => {
      mocked(buildMaker).createChannel.mockRejectedValueOnce(undefined)
      render(<ChannelList tokenStatus={twitchAuthTokenStatus} />)
      const createChannelButton = (await screen.findByText(/Register your channel/i, {
        selector: 'button',
      })) as HTMLButtonElement
      await act(() => {
        createChannelButton.click()
      })
      const continueButton = (await screen.findByText(/Continue/i, {
        selector: 'button',
      })) as HTMLButtonElement
      await act(() => {
        continueButton.click()
      })

      expect(await screen.findByText(/Error creating channel/i)).toBeVisible()
      expect(console.error).toHaveBeenCalled()
    })

    test('expect closing error removes it', async () => {
      mocked(buildMaker).createChannel.mockRejectedValueOnce(undefined)
      render(<ChannelList tokenStatus={twitchAuthTokenStatus} />)
      const createChannelButton = (await screen.findByText(/Register your channel/i, {
        selector: 'button',
      })) as HTMLButtonElement
      await act(() => {
        createChannelButton.click()
      })
      const continueButton = (await screen.findByText(/Continue/i, {
        selector: 'button',
      })) as HTMLButtonElement
      await act(() => {
        continueButton.click()
      })
      const closeSnackbarButton = (await screen.findByLabelText(/Close/i, { selector: 'button' })) as HTMLButtonElement
      act(() => {
        closeSnackbarButton.click()
      })

      expect(screen.queryByText(/Error creating channel/i)).not.toBeInTheDocument()
    })
  })

  describe('delete button', () => {
    test('expect clicking delete button shows delete dialog', async () => {
      render(<ChannelList tokenStatus={tokenForChannel} />)
      const deleteChannelButton = (await screen.findByText(/Delete channel/i, {
        selector: 'button',
      })) as HTMLButtonElement
      await act(() => {
        deleteChannelButton.click()
      })

      expect(await screen.findByText(/Delete channel\?/i)).toBeVisible()
    })

    test('expect closing delete dialog removes it', async () => {
      render(<ChannelList tokenStatus={tokenForChannel} />)
      const deleteChannelButton = (await screen.findByText(/Delete channel/i, {
        selector: 'button',
      })) as HTMLButtonElement
      await act(() => {
        deleteChannelButton.click()
      })
      const backButton = (await screen.findByText(/Go back/i, { selector: 'button' })) as HTMLButtonElement
      await act(() => {
        backButton.click()
      })

      expect(screen.queryByText(/Delete channel\?/i)).not.toBeVisible()
    })

    test('expect clicking continue on delete dialog deletes channel', async () => {
      render(<ChannelList tokenStatus={tokenForChannel} />)
      const deleteChannelButton = (await screen.findByText(/Delete channel/i, {
        selector: 'button',
      })) as HTMLButtonElement
      await act(() => {
        deleteChannelButton.click()
      })
      const continueButton = (await screen.findByText(/Continue/i, { selector: 'button' })) as HTMLButtonElement
      await act(() => {
        continueButton.click()
      })

      expect(screen.queryByText(/Delete channel\?/i)).not.toBeVisible()
      expect(mocked(buildMaker).deleteChannel).toHaveBeenCalledWith('123456', 'otfghjklkgtyuijnmk')
      expect(windowLocationReload).toHaveBeenCalled()
    })

    test('expect error message on delete failure', async () => {
      mocked(buildMaker).deleteChannel.mockRejectedValueOnce(undefined)
      render(<ChannelList tokenStatus={tokenForChannel} />)
      const deleteChannelButton = (await screen.findByText(/Delete channel/i, {
        selector: 'button',
      })) as HTMLButtonElement
      await act(() => {
        deleteChannelButton.click()
      })
      const continueButton = (await screen.findByText(/Continue/i, { selector: 'button' })) as HTMLButtonElement
      await act(() => {
        continueButton.click()
      })

      expect(screen.queryByText(/Delete channel\?/i)).not.toBeVisible()
      expect(screen.queryByText(/Error deleting channel/i)).toBeVisible()
      expect(console.error).toHaveBeenCalled()
    })
  })

  describe('cta', () => {
    test('expect CTA shown when no token', async () => {
      render(<ChannelList tokenStatus={undefined} />)

      expect(mocked(SignUpCta)).toHaveBeenCalledTimes(1)
    })

    test('expect no CTA shown when token present', async () => {
      render(<ChannelList tokenStatus={twitchAuthTokenStatus} />)

      expect(mocked(SignUpCta)).not.toHaveBeenCalled()
    })
  })
})
