import '@testing-library/jest-dom'
import React from 'react'
import { mocked } from 'jest-mock'
import { render } from '@testing-library/react'

import { buildId, channelId } from '@test/__mocks__'
import Authenticated from '@components/auth'
import BuildCreate from '@components/build-create'
import BuildPage from './[buildId]'

jest.mock('@aws-amplify/analytics')
jest.mock('@components/auth')
jest.mock('@components/build-create')

describe('Build page', () => {
  beforeAll(() => {
    mocked(Authenticated).mockImplementation(({ children, setTokenStatus }) => {
      setTokenStatus(undefined)
      return <>{children}</>
    })
    mocked(BuildCreate).mockReturnValue(<></>)
  })

  test('expect rendering BuildPage renders Authenticated', () => {
    render(<BuildPage params={{ buildId, channelId }} />)
    expect(mocked(Authenticated)).toHaveBeenCalledTimes(1)
  })

  test('expect rendering BuildPage renders BuildCreate', () => {
    render(<BuildPage params={{ buildId, channelId }} />)
    expect(mocked(BuildCreate)).toBeCalledWith(expect.objectContaining({ buildId, channelId }), {})
  })
})
