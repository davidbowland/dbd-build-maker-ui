import React, { useState } from 'react'
import Grid from '@mui/material/Grid'
import { Helmet } from 'react-helmet'

import Authenticated from '@components/auth'
import BuildCreate from '@components/build-create'
import PrivacyLink from '@components/privacy-link'
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
        <Grid container sx={{ padding: { sm: '50px', xs: '25px 10px' } }}>
          <Grid item sx={{ m: 'auto', maxWidth: 600, width: '100%' }}>
            <BuildCreate buildId={params.buildId} channelId={params.channelId} tokenStatus={tokenStatus} />
            <PrivacyLink />
          </Grid>
        </Grid>
      </Authenticated>
    </main>
  )
}

export default BuildPage
