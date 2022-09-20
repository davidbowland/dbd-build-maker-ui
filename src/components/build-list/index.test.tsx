import '@testing-library/jest-dom'
import { act, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { mocked } from 'jest-mock'

import * as auth from '@services/auth'
import * as buildMaker from '@services/build-maker'
import { buildBatch, buildKiller, channel, channelId, twitchAuthToken, twitchAuthTokenStatus } from '@test/__mocks__'
import BuildTable from './index'
import ChannelCard from '@components/channel-card'
import GenerateBuildUrl from '@components/generate-build-url'

jest.mock('@aws-amplify/analytics')
jest.mock('@components/channel-card')
jest.mock('@components/generate-build-url')
jest.mock('@services/auth')
jest.mock('@services/build-maker')

describe('BuildList component', () => {
  const consoleError = console.error
  const setInterval = jest.spyOn(window, 'setInterval')

  beforeAll(() => {
    console.error = jest.fn()
    window.HTMLElement.prototype.scrollIntoView = jest.fn()

    mocked(auth).getAccessToken.mockReturnValue(twitchAuthToken)
    mocked(buildMaker).fetchAllBuilds.mockResolvedValue(buildBatch)
    mocked(buildMaker).fetchChannel.mockResolvedValue(channel)
    mocked(buildMaker).updateChannelMods.mockResolvedValue(undefined)
    mocked(ChannelCard).mockReturnValue(<>ChannelCard</>)
    mocked(GenerateBuildUrl).mockReturnValue(<>GenerateBuildUrl</>)
  })

  afterAll(() => {
    console.error = consoleError
  })

  describe('builds', () => {
    test('expect ChannelCard with build count rendered', async () => {
      render(<BuildTable channelId={channelId} tokenStatus={twitchAuthTokenStatus} />)

      expect(mocked(ChannelCard)).toHaveBeenCalledWith({ channelId, tokenStatus: twitchAuthTokenStatus }, {})
    })

    test('expect pending builds to be shown', async () => {
      render(<BuildTable channelId={channelId} tokenStatus={twitchAuthTokenStatus} />)

      expect(await screen.findByText(/Wraith/i)).toBeVisible()
    })

    test('expect completed builds to be shown', async () => {
      render(<BuildTable channelId={channelId} tokenStatus={twitchAuthTokenStatus} />)

      const completedBuildsTab = (await screen.findByText(/Completed builds/i, {
        selector: 'button',
      })) as HTMLButtonElement
      act(() => {
        completedBuildsTab.click()
      })
      expect(await screen.findByText(/Jill Valentine/i)).toBeVisible()
    })

    test('expect no builds shown when no builds', async () => {
      mocked(buildMaker).fetchAllBuilds.mockResolvedValueOnce([])
      render(<BuildTable channelId={channelId} tokenStatus={twitchAuthTokenStatus} />)

      expect(await screen.findByText(/No builds/i)).toBeVisible()
    })

    test('expect error message on fetch reject', async () => {
      mocked(buildMaker).fetchAllBuilds.mockRejectedValueOnce(undefined)
      render(<BuildTable channelId={channelId} tokenStatus={twitchAuthTokenStatus} />)

      expect(await screen.findByText(/Error fetching build list/i)).toBeVisible()
      expect(console.error).toHaveBeenCalled()
    })

    test('expect closing error message removes it', async () => {
      mocked(buildMaker).fetchAllBuilds.mockRejectedValueOnce(undefined)
      render(<BuildTable channelId={channelId} tokenStatus={twitchAuthTokenStatus} />)

      await screen.findByText(/Error fetching build list/i)
      const closeSnackbarButton = (await screen.findByLabelText(/Close/i, { selector: 'button' })) as HTMLButtonElement
      act(() => {
        closeSnackbarButton.click()
      })

      expect(screen.queryByText(/Error fetching build list/i)).not.toBeInTheDocument()
    })

    test('expect clicking scroll to top button scrolls view', async () => {
      render(<BuildTable channelId={channelId} tokenStatus={twitchAuthTokenStatus} />)

      const scroller = (await screen.findByLabelText(/Scroll to top/i)) as HTMLDivElement
      await act(() => {
        scroller.click()
      })

      expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalled()
    })

    test('expect clicking refresh button refreshes builds', async () => {
      render(<BuildTable channelId={channelId} tokenStatus={twitchAuthTokenStatus} />)

      const refreshBuildsButton = (await screen.findByLabelText(/Refresh builds/i)) as HTMLDivElement
      await act(() => {
        refreshBuildsButton.click()
      })

      expect(mocked(buildMaker).fetchAllBuilds).toHaveBeenCalledTimes(1)
    })

    test('expect refresh build is called when setInterval fires', async () => {
      setInterval.mockImplementationOnce((fn) => fn() as unknown as ReturnType<typeof window.setInterval>)
      render(<BuildTable channelId={channelId} tokenStatus={twitchAuthTokenStatus} />)

      expect(mocked(buildMaker).fetchAllBuilds).toHaveBeenCalledTimes(2)
    })
  })

  describe('authorized', () => {
    const tokenForChannel = { ...twitchAuthTokenStatus, id: channelId, name: 'mod1' }

    test('expect updateChannelMods called when channel matches token', async () => {
      render(<BuildTable channelId={channelId} tokenStatus={tokenForChannel} />)

      expect(mocked(buildMaker).updateChannelMods).toHaveBeenCalledWith(channelId, twitchAuthToken)
    })

    test('expect updateChannelMods reject calls console.error', async () => {
      mocked(buildMaker).updateChannelMods.mockRejectedValueOnce(undefined)
      render(<BuildTable channelId={channelId} tokenStatus={tokenForChannel} />)

      expect(mocked(buildMaker).updateChannelMods).toHaveBeenCalledWith(channelId, twitchAuthToken)
      waitFor(() => {
        expect(console.error).toHaveBeenCalled()
      })
    })

    test('expect GenerateBuildUrl shown', async () => {
      render(<BuildTable channelId={channelId} tokenStatus={tokenForChannel} />)

      waitFor(() => {
        expect(mocked(GenerateBuildUrl)).toHaveBeenCalled()
      })
    })

    describe('grid view', () => {
      test('expect marking build completed invokes patchBuild', async () => {
        const mockOperation = jest.fn()
        mocked(buildMaker).patchBuild.mockImplementationOnce(async (channel, build, operations) => {
          operations.map((value) => mockOperation(value))
          return buildKiller
        })
        render(<BuildTable channelId={channelId} tokenStatus={tokenForChannel} />)
        mocked(buildMaker).fetchAllBuilds.mockRejectedValueOnce(undefined)

        const markCompleteButton = (await screen.findByText(/^Mark complete/i, {
          selector: 'button',
        })) as HTMLButtonElement
        act(() => {
          markCompleteButton.click()
        })
        const completedBuildsTab = (await screen.findByText(/Completed builds/i, {
          selector: 'button',
        })) as HTMLButtonElement
        act(() => {
          completedBuildsTab.click()
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
        render(<BuildTable channelId={channelId} tokenStatus={tokenForChannel} />)
        mocked(buildMaker).fetchAllBuilds.mockRejectedValueOnce(undefined)

        const completedBuildsTab = (await screen.findByText(/Completed builds/i, {
          selector: 'button',
        })) as HTMLButtonElement
        act(() => {
          completedBuildsTab.click()
        })
        const unmarkCompleteButton = (await screen.findByText(/Unmark complete/i, {
          selector: 'button',
        })) as HTMLButtonElement
        act(() => {
          unmarkCompleteButton.click()
        })
        const pendingBuildsTab = (await screen.findByText(/Pending builds/i, {
          selector: 'button',
        })) as HTMLButtonElement
        act(() => {
          pendingBuildsTab.click()
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
        expect((await screen.findAllByText(/^Mark complete/i)).length).toEqual(2)
      })

      test('expect patchBuild error shows error message', async () => {
        mocked(buildMaker).patchBuild.mockRejectedValueOnce(undefined)
        render(<BuildTable channelId={channelId} tokenStatus={tokenForChannel} />)

        const markCompleteButton = (await screen.findByText(/^Mark complete/i, {
          selector: 'button',
        })) as HTMLButtonElement
        await act(() => {
          markCompleteButton.click()
        })
        waitFor(() => {
          expect(mocked(buildMaker).patchBuild).toHaveBeenCalled()
          expect(screen.queryByText(/Error updating build/i)).toBeVisible()
        })
        expect(console.error).toHaveBeenCalled()
      })

      test("expect no token doesn't call patchBuild", async () => {
        mocked(auth).getAccessToken.mockReturnValueOnce(null)
        render(<BuildTable channelId={channelId} tokenStatus={tokenForChannel} />)

        mocked(auth).getAccessToken.mockReturnValueOnce(null)
        const markCompleteButton = (await screen.findByText(/^Mark complete/i, {
          selector: 'button',
        })) as HTMLButtonElement
        act(() => {
          markCompleteButton.click()
        })
        expect(mocked(buildMaker).patchBuild).not.toHaveBeenCalled()
      })

      test('expect switching back to grid view switches back', async () => {
        render(<BuildTable channelId={channelId} tokenStatus={tokenForChannel} />)

        const listViewIcon = (await screen.findByLabelText(/List view/i, {
          selector: 'button',
        })) as HTMLButtonElement
        act(() => {
          listViewIcon.click()
        })
        const gridViewIcon = (await screen.findByLabelText(/Grid view/i, {
          selector: 'button',
        })) as HTMLButtonElement
        act(() => {
          gridViewIcon.click()
        })

        expect(
          await screen.findByText(/^Mark complete/i, {
            selector: 'button',
          })
        ).toBeVisible()
      })
    })

    describe('list view', () => {
      test('expect marking build completed invokes patchBuild', async () => {
        const mockOperation = jest.fn()
        mocked(buildMaker).patchBuild.mockImplementationOnce(async (channel, build, operations) => {
          operations.map((value) => mockOperation(value))
          return buildKiller
        })
        render(<BuildTable channelId={channelId} tokenStatus={tokenForChannel} />)
        mocked(buildMaker).fetchAllBuilds.mockRejectedValueOnce(undefined)

        const listViewIcon = (await screen.findByLabelText(/List view/i, {
          selector: 'button',
        })) as HTMLButtonElement
        act(() => {
          listViewIcon.click()
        })
        const markCompleteSwitch = (await screen.findByLabelText(/^Mark complete/i)) as HTMLBaseElement
        act(() => {
          markCompleteSwitch.click()
        })
        const completedBuildsTab = (await screen.findByText(/Completed builds/i, {
          selector: 'button',
        })) as HTMLButtonElement
        act(() => {
          completedBuildsTab.click()
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
        expect(screen.queryAllByLabelText(/Unmark complete/i).length).toEqual(2)
      })

      test('expect unmarking build completed invokes patchBuild', async () => {
        const mockOperation = jest.fn()
        mocked(buildMaker).patchBuild.mockImplementationOnce(async (channel, build, operations) => {
          operations.map((value) => mockOperation(value))
          return buildKiller
        })
        render(<BuildTable channelId={channelId} tokenStatus={tokenForChannel} />)
        mocked(buildMaker).fetchAllBuilds.mockRejectedValueOnce(undefined)

        const listViewIcon = (await screen.findByLabelText(/List view/i, {
          selector: 'button',
        })) as HTMLButtonElement
        act(() => {
          listViewIcon.click()
        })
        const completedBuildsTab = (await screen.findByText(/Completed builds/i, {
          selector: 'button',
        })) as HTMLButtonElement
        act(() => {
          completedBuildsTab.click()
        })
        const unmarkCompleteSwitch = (await screen.findByLabelText(/Unmark complete/i)) as HTMLBaseElement
        act(() => {
          unmarkCompleteSwitch.click()
        })
        const pendingBuildsTab = (await screen.findByText(/Pending builds/i, {
          selector: 'button',
        })) as HTMLButtonElement
        act(() => {
          pendingBuildsTab.click()
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
        expect((await screen.findAllByLabelText(/^Mark complete/i)).length).toEqual(2)
      })

      test('expect patchBuild error shows error message', async () => {
        mocked(buildMaker).patchBuild.mockRejectedValueOnce(undefined)
        render(<BuildTable channelId={channelId} tokenStatus={tokenForChannel} />)

        const listViewIcon = (await screen.findByLabelText(/List view/i, {
          selector: 'button',
        })) as HTMLButtonElement
        act(() => {
          listViewIcon.click()
        })
        const markCompleteSwitch = (await screen.findByLabelText(/^Mark complete/i)) as HTMLBaseElement
        await act(() => {
          markCompleteSwitch.click()
        })
        waitFor(() => {
          expect(mocked(buildMaker).patchBuild).toHaveBeenCalled()
          expect(screen.queryByText(/Error updating build/i)).toBeVisible()
        })
        expect(console.error).toHaveBeenCalled()
      })

      test("expect no token doesn't call patchBuild", async () => {
        mocked(auth).getAccessToken.mockReturnValueOnce(null)
        render(<BuildTable channelId={channelId} tokenStatus={tokenForChannel} />)

        mocked(auth).getAccessToken.mockReturnValueOnce(null)
        mocked(auth).getAccessToken.mockReturnValueOnce(null)
        const listViewIcon = (await screen.findByLabelText(/List view/i, {
          selector: 'button',
        })) as HTMLButtonElement
        act(() => {
          listViewIcon.click()
        })
        const markCompleteSwitch = (await screen.findByLabelText(/^Mark complete/i)) as HTMLBaseElement
        act(() => {
          markCompleteSwitch.click()
        })
        expect(mocked(buildMaker).patchBuild).not.toHaveBeenCalled()
      })

      test('expect clicking on completed when not mod does nothing', async () => {
        render(<BuildTable channelId={channelId} tokenStatus={twitchAuthTokenStatus} />)

        const listViewIcon = (await screen.findByLabelText(/List view/i, {
          selector: 'button',
        })) as HTMLButtonElement
        act(() => {
          listViewIcon.click()
        })
        const markCompleteSwitch = (await screen.findByLabelText(/^Mark complete/i)) as HTMLBaseElement
        act(() => {
          markCompleteSwitch.click()
        })
        expect(mocked(buildMaker).patchBuild).not.toHaveBeenCalled()
      })

      test('expect no builds shown when no builds', async () => {
        mocked(buildMaker).fetchAllBuilds.mockResolvedValueOnce([])
        render(<BuildTable channelId={channelId} tokenStatus={twitchAuthTokenStatus} />)

        const listViewIcon = (await screen.findByLabelText(/List view/i, {
          selector: 'button',
        })) as HTMLButtonElement
        act(() => {
          listViewIcon.click()
        })
        expect(await screen.findByText(/No builds/i)).toBeVisible()
      })
    })
  })

  describe('channel', () => {
    test('expect error fetching channel info displays error', async () => {
      mocked(buildMaker).fetchChannel.mockRejectedValueOnce(undefined)
      render(<BuildTable channelId={channelId} tokenStatus={twitchAuthTokenStatus} />)

      expect(await screen.findByText(/Error fetching channel info/i)).toBeVisible()
      expect(console.error).toHaveBeenCalled()
    })

    test('expect closing error message removes it', async () => {
      mocked(buildMaker).fetchChannel.mockRejectedValueOnce(undefined)
      render(<BuildTable channelId={channelId} tokenStatus={twitchAuthTokenStatus} />)

      await screen.findByText(/Error fetching channel info/i)
      const closeSnackbarButton = (await screen.findByLabelText(/Close/i, { selector: 'button' })) as HTMLButtonElement
      act(() => {
        closeSnackbarButton.click()
      })

      expect(screen.queryByText(/Error fetching channel info/i)).not.toBeInTheDocument()
    })

    test('expect mods shown when requested', async () => {
      render(<BuildTable channelId={channelId} tokenStatus={twitchAuthTokenStatus} />)

      const modsTab = (await screen.findByText(/Mods/i, {
        selector: 'button',
      })) as HTMLButtonElement
      act(() => {
        modsTab.click()
      })

      expect(await screen.findByText(/mod1/i)).toBeInTheDocument()
    })

    test('expect no mods shown when no mods', async () => {
      mocked(buildMaker).fetchChannel.mockResolvedValueOnce({ ...channel, mods: [] })
      render(<BuildTable channelId={channelId} tokenStatus={twitchAuthTokenStatus} />)

      const modsTab = (await screen.findByText(/Mods/i, {
        selector: 'button',
      })) as HTMLButtonElement
      act(() => {
        modsTab.click()
      })

      expect(await screen.findByText(/No mods/i)).toBeInTheDocument()
    })
  })
})
