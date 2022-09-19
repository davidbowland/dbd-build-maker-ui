import React, { useState } from 'react'
import Grid from '@mui/material/Grid'
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
        <Grid container sx={{ padding: { sm: '50px', xs: '25px 10px' } }}>
          <Grid item sx={{ m: 'auto', maxWidth: 1200, width: '100%' }}>
            <ChannelList tokenStatus={tokenStatus} />
          </Grid>
        </Grid>
      </Authenticated>
    </main>
  )
}

export default Index
