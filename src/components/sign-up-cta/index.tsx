import Button from '@mui/material/Button'
import LoginIcon from '@mui/icons-material/Login'
import React from 'react'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { initiateTwitchLogin } from '@services/auth'

const SignUpCta = (): JSX.Element => {
  return (
    <>
      <Stack margin="auto" maxWidth="600px" spacing={2}>
        <Typography sx={{ textAlign: 'center' }} variant="h6">
          Sign in with Twitch to get started collecting builds for your channel!
        </Typography>
        <Button
          data-amplify-analytics-name="cta-click"
          data-amplify-analytics-on="click"
          fullWidth
          onClick={initiateTwitchLogin}
          startIcon={<LoginIcon />}
          variant="contained"
        >
          Sign in with Twitch
        </Button>
        <Typography>Your account is free and we collect no personally identifiable information.</Typography>
      </Stack>
    </>
  )
}

export default SignUpCta
