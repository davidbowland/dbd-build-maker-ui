import '@testing-library/jest-dom'
import React from 'react'
import { mocked } from 'jest-mock'
import { render } from '@testing-library/react'

import Authenticated from '@components/auth'
import ChannelList from '@components/channel-list'
import Index from './index'

jest.mock('@aws-amplify/analytics')
jest.mock('@components/auth')
jest.mock('@components/channel-list')

describe('Index page', () => {
  beforeAll(() => {
    mocked(Authenticated).mockImplementation(({ children, setTokenStatus }) => {
      setTokenStatus(undefined)
      return <>{children}</>
    })
    mocked(ChannelList).mockReturnValue(<></>)
  })

  test('expect rendering Index renders Authenticated', () => {
    render(<Index />)
    expect(mocked(Authenticated)).toHaveBeenCalledTimes(1)
  })

  test('expect rendering Index renders SessionCreate', () => {
    render(<Index />)
    expect(mocked(ChannelList)).toHaveBeenCalledTimes(1)
  })
})
