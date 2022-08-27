import React, { useState } from 'react'
import { Helmet } from 'react-helmet'

import Authenticated from '@components/auth'
import BuildList from '@components/build-list'
import { TwitchTokenStatus } from '@types'

export interface ChannelPageProps {
  params: {
    channelId: string
  }
}

const ChannelPage = ({ params }: ChannelPageProps): JSX.Element => {
  const [tokenStatus, setTokenStatus] = useState<TwitchTokenStatus | undefined>(undefined)

  return (
    <main style={{ minHeight: '90vh' }}>
      <Helmet>
        <title>DBD Build Maker | dbowland.com</title>
      </Helmet>
      <Authenticated setTokenStatus={setTokenStatus}>
        <section style={{ padding: '50px 10px' }}>
          <BuildList channelId={params.channelId} tokenStatus={tokenStatus} />
        </section>
      </Authenticated>
    </main>
  )
}

export default ChannelPage
