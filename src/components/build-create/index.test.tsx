import '@testing-library/jest-dom'
import { act, fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { mocked } from 'jest-mock'

import * as buildMaker from '@services/build-maker'
import * as gatsby from 'gatsby'
import { buildId, buildOptions, buildTokenResponse, channelId } from '@test/__mocks__'
import BuildCreate from './index'
import ChannelCard from '@components/channel-card'

jest.mock('@aws-amplify/analytics')
jest.mock('@components/channel-card')
jest.mock('@services/build-maker')
jest.mock('gatsby')

describe('BuildCreate component', () => {
  const consoleError = console.error
  const mathRandom = Math.random
  const mockRandom = jest.fn()

  beforeAll(() => {
    Math.random = mockRandom.mockReturnValue(0.5)
    console.error = jest.fn()
    mocked(buildMaker).fetchBuildOptions.mockResolvedValue(buildOptions)
    mocked(buildMaker).fetchBuildToken.mockResolvedValue(buildTokenResponse)
    mocked(ChannelCard).mockReturnValue(<>ChannelCard</>)
  })

  afterAll(() => {
    Math.random = mathRandom
    console.error = consoleError
  })

  describe('initial load', () => {
    test('expect ChannelCard rendered', async () => {
      render(<BuildCreate buildId={buildId} channelId={channelId} />)

      expect(mocked(ChannelCard)).toHaveBeenCalledWith({ channelId }, {})
    })

    test('expect fetchBuildOptions failure displays message', async () => {
      mocked(buildMaker).fetchBuildOptions.mockRejectedValueOnce(undefined)
      render(<BuildCreate buildId={buildId} channelId={channelId} />)

      expect(
        (await screen.findAllByText(/Error fetching build options, please refresh the page to try again/i)).length
      ).toEqual(2)
      expect(console.error).toHaveBeenCalledTimes(1)
    })

    test('expect fetchBuildToken failure displays message', async () => {
      mocked(buildMaker).fetchBuildToken.mockRejectedValueOnce(undefined)
      render(<BuildCreate buildId={buildId} channelId={channelId} />)

      expect(
        (await screen.findAllByText(/Error validating build token\. Your link may have expired\./i)).length
      ).toEqual(2)
      expect(console.error).toHaveBeenCalledTimes(1)
    })

    test('expect closing error message snackbar removes it', async () => {
      mocked(buildMaker).fetchBuildOptions.mockRejectedValueOnce(undefined)
      render(<BuildCreate buildId={buildId} channelId={channelId} />)

      const closeSnackbarButton = (await screen.findByLabelText(/Close/i, { selector: 'button' })) as HTMLButtonElement
      act(() => {
        closeSnackbarButton.click()
      })

      expect(
        (await screen.findAllByText(/Error fetching build options, please refresh the page to try again/i)).length
      ).toEqual(1)
    })
  })

  describe('CreateCard submit', () => {
    test('expect submitting build calls createBuild, displays a message, and navigates', async () => {
      render(<BuildCreate buildId={buildId} channelId={channelId} />)

      const submitButton = (await screen.findByText(/Submit build/i, { selector: 'button' })) as HTMLButtonElement
      act(() => {
        submitButton.click()
      })

      expect(await screen.findByText(/Build submitted successfully!/i)).toBeVisible()
      expect(mocked(buildMaker).createBuild).toHaveBeenCalledWith('123456', 'ytrfghjklkmnbvfty', {
        addon1: 'Any',
        addon2: 'Any',
        character: 'Any',
        item: undefined,
        notes: '',
        offering: 'Any',
        perk1: 'Any',
        perk2: 'Any',
        perk3: 'Any',
        perk4: 'Any',
        submitter: 'cfb',
      })
      expect(mocked(gatsby).navigate).toHaveBeenCalledWith('/c/123456')
    })

    test('expect closing success message removes it', async () => {
      render(<BuildCreate buildId={buildId} channelId={channelId} />)

      const submitButton = (await screen.findByText(/Submit build/i, { selector: 'button' })) as HTMLButtonElement
      act(() => {
        submitButton.click()
      })
      const closeSnackbarButton = (await screen.findByLabelText(/Close/i, { selector: 'button' })) as HTMLButtonElement
      act(() => {
        closeSnackbarButton.click()
      })

      expect(screen.queryByText(/Build submitted successfully!/i)).not.toBeInTheDocument()
    })

    test('expect error message when createBuild rejects', async () => {
      mocked(buildMaker).createBuild.mockRejectedValueOnce(undefined)
      render(<BuildCreate buildId={buildId} channelId={channelId} />)

      const submitButton = (await screen.findByText(/Submit build/i, { selector: 'button' })) as HTMLButtonElement
      act(() => {
        submitButton.click()
      })

      expect(
        await screen.findByText(/Error processing submission, please reload the page and try again/i)
      ).toBeVisible()
      expect(console.error).toHaveBeenCalledTimes(1)
    })

    test('expect closing error message removes it', async () => {
      mocked(buildMaker).createBuild.mockRejectedValueOnce(undefined)
      render(<BuildCreate buildId={buildId} channelId={channelId} />)

      const submitButton = (await screen.findByText(/Submit build/i, { selector: 'button' })) as HTMLButtonElement
      act(() => {
        submitButton.click()
      })
      const closeSnackbarButton = (await screen.findByLabelText(/Close/i, { selector: 'button' })) as HTMLButtonElement
      act(() => {
        closeSnackbarButton.click()
      })

      expect(
        screen.queryByText(/Error processing submission, please reload the page and try again/i)
      ).not.toBeInTheDocument()
    })
  })

  describe('CreateCard form', () => {
    test('expect altered build submitted', async () => {
      render(<BuildCreate buildId={buildId} channelId={channelId} />)

      const radioButton = (await screen.findByLabelText(/Survivor/i)) as HTMLInputElement
      act(() => {
        radioButton.click()
      })
      const characterInput = (await screen.findByTestId(/Character/i)) as HTMLInputElement
      act(() => {
        fireEvent.change(characterInput, { target: { value: 'Nea Karlsson' } })
      })
      const itemInput = (await screen.findByTestId(/Item/i)) as HTMLInputElement
      act(() => {
        fireEvent.change(itemInput, { target: { value: 'Flashlight' } })
      })
      const addon1Input = (await screen.findByTestId(/Addon1/i)) as HTMLInputElement
      act(() => {
        fireEvent.change(addon1Input, { target: { value: 'Battery' } })
      })
      const addon2Input = (await screen.findByTestId(/Addon2/i)) as HTMLInputElement
      act(() => {
        fireEvent.change(addon2Input, { target: { value: 'Leather Grip' } })
      })
      const perk1Input = (await screen.findByTestId(/Perk1/i)) as HTMLInputElement
      act(() => {
        fireEvent.change(perk1Input, { target: { value: 'Head On' } })
      })
      const perk2Input = (await screen.findByTestId(/Perk2/i)) as HTMLInputElement
      act(() => {
        fireEvent.change(perk2Input, { target: { value: 'Dance With Me' } })
      })
      const perk3Input = (await screen.findByTestId(/Perk3/i)) as HTMLInputElement
      act(() => {
        fireEvent.change(perk3Input, { target: { value: 'Saboteur' } })
      })
      const perk4Input = (await screen.findByTestId(/Perk4/i)) as HTMLInputElement
      act(() => {
        fireEvent.change(perk4Input, { target: { value: 'Smash Hit' } })
      })
      const offeringInput = (await screen.findByTestId(/Offering/i)) as HTMLInputElement
      act(() => {
        fireEvent.change(offeringInput, { target: { value: 'Chalk Pouch' } })
      })
      const notesInput = (await screen.findByLabelText(/Notes/i)) as HTMLInputElement
      act(() => {
        fireEvent.change(notesInput, { target: { value: 'Have fun!' } })
      })

      const submitButton = (await screen.findByText(/Submit build/i, { selector: 'button' })) as HTMLButtonElement
      act(() => {
        submitButton.click()
      })

      expect(await screen.findByText(/Build submitted successfully!/i)).toBeVisible()
      expect(mocked(buildMaker).createBuild).toHaveBeenCalledWith('123456', 'ytrfghjklkmnbvfty', {
        addon1: 'Battery',
        addon2: 'Leather Grip',
        character: 'Nea Karlsson',
        item: 'Flashlight',
        notes: 'Have fun!',
        offering: 'Chalk Pouch',
        perk1: 'Head On',
        perk2: 'Dance With Me',
        perk3: 'Saboteur',
        perk4: 'Smash Hit',
        submitter: 'cfb',
      })
    })

    test('expect random build submitted', async () => {
      render(<BuildCreate buildId={buildId} channelId={channelId} />)

      const randomCharacterIcon = (await screen.findByLabelText(/Shuffle character/i)) as HTMLImageElement
      act(() => {
        randomCharacterIcon.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      })
      const submitButton = (await screen.findByText(/Submit build/i, { selector: 'button' })) as HTMLButtonElement
      act(() => {
        submitButton.click()
      })

      expect(await screen.findByText(/Build submitted successfully!/i)).toBeVisible()
      expect(mocked(buildMaker).createBuild).toHaveBeenCalledWith('123456', 'ytrfghjklkmnbvfty', {
        addon1: 'Any',
        addon2: 'Any',
        character: 'Huntress',
        item: undefined,
        notes: '',
        offering: 'Any',
        perk1: 'Any',
        perk2: 'Any',
        perk3: 'Any',
        perk4: 'Any',
        submitter: 'cfb',
      })
    })
  })
})
