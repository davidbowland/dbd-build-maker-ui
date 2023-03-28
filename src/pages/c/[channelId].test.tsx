import '@testing-library/jest-dom'
import { mocked } from 'jest-mock'
import React from 'react'
import { render } from '@testing-library/react'

import Authenticated from '@components/auth'
import BuildTable from '@components/build-list'
import { channelId } from '@test/__mocks__'
import ChannelPage from './[channelId]'
import PrivacyLink from '@components/privacy-link'

jest.mock('@aws-amplify/analytics')
jest.mock('@components/auth')
jest.mock('@components/build-list')
jest.mock('@components/privacy-link')

describe('Channel page', () => {
  beforeAll(() => {
    mocked(Authenticated).mockImplementation(({ children, setTokenStatus }) => {
      setTokenStatus(undefined)
      return <>{children}</>
    })
    mocked(BuildTable).mockReturnValue(<></>)
    mocked(PrivacyLink).mockReturnValue(<></>)
  })

  test('expect rendering ChannelPage renders Authenticated', () => {
    render(<ChannelPage params={{ channelId }} />)
    expect(mocked(Authenticated)).toHaveBeenCalledTimes(1)
  })

  test('expect rendering ChannelPage renders BuildList', () => {
    render(<ChannelPage params={{ channelId }} />)
    expect(mocked(BuildTable)).toBeCalledWith(expect.objectContaining({ channelId }), {})
  })

  test('expect rendering BuildPage renders PrivacyLink', () => {
    render(<ChannelPage params={{ channelId }} />)
    expect(mocked(PrivacyLink)).toHaveBeenCalledTimes(1)
  })
})
