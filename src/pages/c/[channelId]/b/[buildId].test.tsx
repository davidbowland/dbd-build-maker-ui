import '@testing-library/jest-dom'
import { mocked } from 'jest-mock'
import React from 'react'
import { render } from '@testing-library/react'

import { buildId, channelId } from '@test/__mocks__'
import Authenticated from '@components/auth'
import BuildCreate from '@components/build-create'
import BuildPage from './[buildId]'
import PrivacyLink from '@components/privacy-link'

jest.mock('@aws-amplify/analytics')
jest.mock('@components/auth')
jest.mock('@components/build-create')
jest.mock('@components/privacy-link')

describe('Build page', () => {
  beforeAll(() => {
    mocked(Authenticated).mockImplementation(({ children, setTokenStatus }) => {
      setTokenStatus(undefined)
      return <>{children}</>
    })
    mocked(BuildCreate).mockReturnValue(<></>)
    mocked(PrivacyLink).mockReturnValue(<></>)
  })

  test('expect rendering BuildPage renders Authenticated', () => {
    render(<BuildPage params={{ buildId, channelId }} />)
    expect(mocked(Authenticated)).toHaveBeenCalled()
  })

  test('expect rendering BuildPage renders BuildCreate', () => {
    render(<BuildPage params={{ buildId, channelId }} />)
    expect(mocked(BuildCreate)).toBeCalledWith(
      expect.objectContaining({ buildId, channelId, tokenStatus: undefined }),
      {}
    )
  })

  test('expect rendering BuildPage renders PrivacyLink', () => {
    render(<BuildPage params={{ buildId, channelId }} />)
    expect(mocked(PrivacyLink)).toHaveBeenCalledTimes(1)
  })
})
