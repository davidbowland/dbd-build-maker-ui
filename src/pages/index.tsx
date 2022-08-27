import React, { useState } from 'react'
import { Helmet } from 'react-helmet'

import Authenticated from '@components/auth'
import ChannelList from '@components/channel-list'
import { TwitchTokenStatus } from '@types'

const Index = (): JSX.Element => {
  const [tokenStatus, setTokenStatus] = useState<TwitchTokenStatus | undefined>(undefined)

  return (
    <main style={{ minHeight: '90vh' }}>
      <Helmet>
        <title>DBD Build Maker | dbowland.com</title>
      </Helmet>
      <Authenticated setTokenStatus={setTokenStatus}>
        <section style={{ padding: '50px 10px' }}>
          <ChannelList tokenStatus={tokenStatus} />
        </section>
      </Authenticated>
    </main>
  )
}

export default Index
