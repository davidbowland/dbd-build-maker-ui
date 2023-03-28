import '@testing-library/jest-dom'
import { act, render, screen } from '@testing-library/react'
import { mocked } from 'jest-mock'
import React from 'react'

import * as auth from '@services/auth'
import SignUpCta from './index'

jest.mock('@services/auth')

describe('SignUpCta component', () => {
  test('expect sign in button to be rendered', async () => {
    render(<SignUpCta />)
    expect(await screen.findByText(/Sign in with Twitch/i, { selector: 'button' })).toBeVisible()
  })

  test('expect sign in button invokes initiateTwitchLogin', async () => {
    render(<SignUpCta />)

    const signInButton = (await screen.findByText(/Sign in with Twitch/i, { selector: 'button' })) as HTMLButtonElement
    await act(async () => {
      signInButton.click()
    })

    expect(mocked(auth).initiateTwitchLogin).toHaveBeenCalled()
  })
})
