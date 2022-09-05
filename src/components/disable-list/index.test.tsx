import '@testing-library/jest-dom'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { mocked } from 'jest-mock'

import * as buildMaker from '@services/build-maker'
import { buildOptions, channel, channelId, twitchAuthToken } from '@test/__mocks__'
import DisableList from './index'

jest.mock('@aws-amplify/analytics')
jest.mock('@services/build-maker')

describe('DisableList component', () => {
  const consoleError = console.error

  beforeAll(() => {
    console.error = jest.fn()
    mocked(buildMaker).fetchBuildOptions.mockResolvedValue(buildOptions)
    mocked(buildMaker).fetchChannel.mockResolvedValue(channel)
  })

  afterAll(() => {
    console.error = consoleError
  })

  describe('data load', () => {
    test('expect build options rendered', async () => {
      render(<DisableList accessToken={twitchAuthToken} channelId={channelId} />)
      const editBuildOptionsButton = (await screen.findByText(/Edit build options/i, {
        selector: 'button',
      })) as HTMLButtonElement
      act(() => {
        editBuildOptionsButton.click()
      })

      expect(mocked(buildMaker).fetchBuildOptions).toHaveBeenCalled()
      expect(mocked(buildMaker).fetchChannel).toHaveBeenCalledWith(channelId)
      expect(await screen.findByText(/Killers/i)).toBeVisible()
    })

    test('expect fetchBuildOptions failure displays message', async () => {
      mocked(buildMaker).fetchBuildOptions.mockRejectedValueOnce(undefined)

      render(<DisableList accessToken={twitchAuthToken} channelId={channelId} />)
      const editBuildOptionsButton = (await screen.findByText(/Edit build options/i, {
        selector: 'button',
      })) as HTMLButtonElement
      act(() => {
        editBuildOptionsButton.click()
      })

      expect(await screen.findByText(/Error fetching build options, please try again/i)).toBeVisible()
      expect(console.error).toHaveBeenCalledTimes(1)
    })

    test('expect fetchChannel failure displays message', async () => {
      mocked(buildMaker).fetchChannel.mockRejectedValueOnce(undefined)

      render(<DisableList accessToken={twitchAuthToken} channelId={channelId} />)
      const editBuildOptionsButton = (await screen.findByText(/Edit build options/i, {
        selector: 'button',
      })) as HTMLButtonElement
      act(() => {
        editBuildOptionsButton.click()
      })

      expect(await screen.findByText(/Error fetching channel details, please try again/i)).toBeVisible()
      expect(console.error).toHaveBeenCalledTimes(1)
    })

    test('expect closing error message snackbar removes it', async () => {
      mocked(buildMaker).fetchChannel.mockRejectedValueOnce(undefined)

      render(<DisableList accessToken={twitchAuthToken} channelId={channelId} />)
      const editBuildOptionsButton = (await screen.findByText(/Edit build options/i, {
        selector: 'button',
      })) as HTMLButtonElement
      act(() => {
        editBuildOptionsButton.click()
      })
      const closeSnackbarButton = (await screen.findByLabelText(/Close/i, { selector: 'button' })) as HTMLButtonElement
      act(() => {
        closeSnackbarButton.click()
      })

      expect(screen.queryByText(/Error fetching channel details, please try again/i)).not.toBeInTheDocument()
    })
  })

  describe('save build options', () => {
    test('expect patchChannel called when save clicked', async () => {
      render(<DisableList accessToken={twitchAuthToken} channelId={channelId} />)

      const editBuildOptionsButton = (await screen.findByText(/Edit build options/i, {
        selector: 'button',
      })) as HTMLButtonElement
      act(() => {
        editBuildOptionsButton.click()
      })
      const killerListItem = (await screen.findByText(/Killers/i)) as HTMLBodyElement
      act(() => {
        killerListItem.click()
      })
      const notesListItem = (await screen.findByText(/Notes/i)) as HTMLBodyElement
      act(() => {
        notesListItem.click()
      })
      const saveOptionsClick = (await screen.findByText(/Save/i)) as HTMLButtonElement
      act(() => {
        saveOptionsClick.click()
      })

      expect(mocked(buildMaker).patchChannel).toHaveBeenCalledWith(
        '123456',
        [
          { op: 'add', path: '/disabledOptions/0', value: 'Killers' },
          { op: 'add', path: '/disabledOptions/1', value: 'Notes' },
        ],
        'otfghjklkgtyuijnmk'
      )
    })

    test('expect re-checking box works', async () => {
      render(<DisableList accessToken={twitchAuthToken} channelId={channelId} />)

      const editBuildOptionsButton = (await screen.findByText(/Edit build options/i, {
        selector: 'button',
      })) as HTMLButtonElement
      act(() => {
        editBuildOptionsButton.click()
      })
      const killerListItem = (await screen.findByText(/Killers/i)) as HTMLBodyElement
      act(() => {
        killerListItem.click()
      })
      const survivorListItem = (await screen.findByText(/Survivors/i)) as HTMLBodyElement
      act(() => {
        survivorListItem.click()
      })
      const killerListItem2 = (await screen.findByText(/Killers/i)) as HTMLBodyElement
      act(() => {
        killerListItem2.click()
      })
      const saveOptionsClick = (await screen.findByText(/Save/i)) as HTMLButtonElement
      act(() => {
        saveOptionsClick.click()
      })

      expect(mocked(buildMaker).patchChannel).toHaveBeenCalledWith(
        '123456',
        [{ op: 'add', path: '/disabledOptions/0', value: 'Survivors' }],
        'otfghjklkgtyuijnmk'
      )
    })

    test('expect error message when patchChannel rejects', async () => {
      mocked(buildMaker).patchChannel.mockRejectedValueOnce(undefined)
      render(<DisableList accessToken={twitchAuthToken} channelId={channelId} />)

      const editBuildOptionsButton = (await screen.findByText(/Edit build options/i, {
        selector: 'button',
      })) as HTMLButtonElement
      act(() => {
        editBuildOptionsButton.click()
      })
      const killerListItem = (await screen.findByText(/Killers/i)) as HTMLBodyElement
      act(() => {
        killerListItem.click()
      })
      const saveOptionsClick = (await screen.findByText(/Save/i)) as HTMLButtonElement
      act(() => {
        saveOptionsClick.click()
      })

      expect(
        await screen.findByText(/Error saving build options, please refresh the page and try again/i)
      ).toBeVisible()
      expect(console.error).toHaveBeenCalledTimes(1)
    })

    test('expect error message when neither killers nor survivors is selected', async () => {
      mocked(buildMaker).patchChannel.mockRejectedValueOnce(undefined)
      render(<DisableList accessToken={twitchAuthToken} channelId={channelId} />)

      const editBuildOptionsButton = (await screen.findByText(/Edit build options/i, {
        selector: 'button',
      })) as HTMLButtonElement
      act(() => {
        editBuildOptionsButton.click()
      })
      const killerListItem = (await screen.findByText(/Killers/i)) as HTMLBodyElement
      act(() => {
        killerListItem.click()
      })
      const survivorsListItem = (await screen.findByText(/Survivors/i)) as HTMLBodyElement
      act(() => {
        survivorsListItem.click()
      })
      const saveOptionsClick = (await screen.findByText(/Save/i)) as HTMLButtonElement
      act(() => {
        saveOptionsClick.click()
      })

      expect(await screen.findByText(/Either Killers or Survivors must be enabled/i)).toBeVisible()
    })

    test('expect expand works', async () => {
      render(<DisableList accessToken={twitchAuthToken} channelId={channelId} />)

      const editBuildOptionsButton = (await screen.findByText(/Edit build options/i, {
        selector: 'button',
      })) as HTMLButtonElement
      act(() => {
        editBuildOptionsButton.click()
      })
      const killerExpand = (await screen.findByLabelText(/Expand Killers/i)) as HTMLBodyElement
      act(() => {
        killerExpand.click()
      })

      expect(await screen.findByText(/Artist/i)).toBeVisible()
    })

    test('expect contract works', async () => {
      render(<DisableList accessToken={twitchAuthToken} channelId={channelId} />)

      const editBuildOptionsButton = (await screen.findByText(/Edit build options/i, {
        selector: 'button',
      })) as HTMLButtonElement
      act(() => {
        editBuildOptionsButton.click()
      })
      const killerExpand = (await screen.findByLabelText(/Expand Killers/i)) as HTMLBodyElement
      act(() => {
        killerExpand.click()
      })
      await screen.findByText(/Artist/i)
      const killerCollapse = (await screen.findByLabelText(/Collapse Killers/i)) as HTMLBodyElement
      act(() => {
        killerCollapse.click()
      })

      waitFor(() => {
        expect(screen.queryByLabelText(/Collapse Killers/i)).not.toBeVisible()
      })
    })
  })

  describe('close dialog', () => {
    test('expect dialog closes on escape', async () => {
      render(<DisableList accessToken={twitchAuthToken} channelId={channelId} />)

      const editBuildOptionsButton = (await screen.findByText(/Edit build options/i, {
        selector: 'button',
      })) as HTMLButtonElement
      act(() => {
        editBuildOptionsButton.click()
      })
      const dialog = (await screen.findByText(/Enabled build options/i)) as HTMLBodyElement
      await act(() => {
        fireEvent.keyDown(dialog, {
          code: 'Escape',
          key: 'Escape',
        })
      })

      waitFor(() => {
        expect(screen.queryByText(/Save$/i, { selector: 'button' })).not.toBeInTheDocument()
      })
    })

    test("expect dialog doesn't close while loading", async () => {
      mocked(buildMaker).patchChannel.mockReturnValueOnce(new Promise(() => undefined))
      render(<DisableList accessToken={twitchAuthToken} channelId={channelId} />)

      const editBuildOptionsButton = (await screen.findByText(/Edit build options/i, {
        selector: 'button',
      })) as HTMLButtonElement
      act(() => {
        editBuildOptionsButton.click()
      })
      const killerListItem = (await screen.findByText(/Killers/i)) as HTMLBodyElement
      act(() => {
        killerListItem.click()
      })
      const saveOptionsClick = (await screen.findByText(/Save/i)) as HTMLButtonElement
      act(() => {
        saveOptionsClick.click()
      })
      const dialog = (await screen.findByText(/Enabled build options/i)) as HTMLBodyElement
      await act(() => {
        fireEvent.keyDown(dialog, {
          code: 'Escape',
          key: 'Escape',
        })
      })

      expect(await screen.findByText(/Save$/i, { selector: 'button' })).toBeInTheDocument()
    })
  })
})
