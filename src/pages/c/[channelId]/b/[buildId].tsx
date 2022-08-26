import React, { useState } from 'react'
import { Helmet } from 'react-helmet'

import Authenticated from '@components/auth'
import BuildCreate from '@components/build-create'
import { TwitchTokenStatus } from '@types'

export interface BuildPageProps {
  params: {
    buildId: string
    channelId: string
  }
}

const BuildPage = ({ params }: BuildPageProps): JSX.Element => {
  const [tokenStatus, setTokenStatus] = useState<TwitchTokenStatus | undefined>(undefined)

  return (
    <main style={{ minHeight: '90vh' }}>
      <Helmet>
        <title>DBD Build Maker | dbowland.com</title>
      </Helmet>
      <Authenticated setTokenStatus={setTokenStatus}>
        <section style={{ padding: '50px' }}>
          <BuildCreate buildId={params.buildId} channelId={params.channelId} tokenStatus={tokenStatus} />
        </section>
      </Authenticated>
    </main>
  )
}

export default BuildPage
