import React, { useState } from 'react'
import { Helmet } from 'react-helmet'
import Paper from '@mui/material/Paper'

import '@config/amplify'
import Authenticated from '@components/auth'
import PrivacyPolicy from '@components/privacy-policy'
import { TwitchTokenStatus } from '@types'

const PrivacyPage = (): JSX.Element => {
  const [_, setTokenStatus] = useState<TwitchTokenStatus | undefined>(undefined)

  return (
    <>
      <Helmet>
        <title>Privacy Policy -- dbd.dbowland.com</title>
      </Helmet>
      <main>
        <Authenticated setTokenStatus={setTokenStatus}>
          <Paper elevation={3} sx={{ margin: 'auto', maxWidth: '900px' }}>
            <PrivacyPolicy />
          </Paper>
        </Authenticated>
      </main>
    </>
  )
}

export default PrivacyPage
