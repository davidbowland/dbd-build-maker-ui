import React, { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import AppBar from '@mui/material/AppBar'
import Snackbar from '@mui/material/Snackbar'
import Toolbar from '@mui/material/Toolbar'

import { getAccessToken, initiateTwitchLogin, redirectLogin } from '@services/auth'
import LoggedInBar from './logged-in-bar'
import LoggedOutBar from './logged-out-bar'
import { TwitchTokenStatus } from '@types'
import { validateTwitchToken } from '@services/build-maker'

export interface AuthenticatedProps {
  children: JSX.Element | JSX.Element[]
  setTokenStatus: (status: TwitchTokenStatus | undefined) => void
}

const Authenticated = ({ children, setTokenStatus }: AuthenticatedProps): JSX.Element => {
  const [errorMessage, setErrorMessage] = useState<string | undefined>()
  const [userName, setUserName] = useState<string | undefined>()
  const authToken = getAccessToken()

  const snackbarErrorClose = (): void => {
    setErrorMessage(undefined)
  }

  // Set user if already logged in
  useEffect((): void => {
    if (authToken) {
      validateTwitchToken(authToken)
        .then((result: TwitchTokenStatus) => {
          setTokenStatus(result)
          if (result.status === 'valid') {
            setUserName(result.name)
            redirectLogin()
          } else {
            setErrorMessage('Token has expired, refreshing token')
            initiateTwitchLogin()
          }
        })
        .catch((error) => {
          console.error('validateTwitchToken', { error })
          setErrorMessage('Problem verifying token. Refresh the page.')
          setTokenStatus(undefined)
        })
    }
  }, [])

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          {authToken ? <LoggedInBar userName={userName} /> : <LoggedOutBar initiateTwitchLogin={initiateTwitchLogin} />}
        </Toolbar>
      </AppBar>
      {children}
      <Snackbar autoHideDuration={20_000} onClose={snackbarErrorClose} open={errorMessage !== undefined}>
        <Alert onClose={snackbarErrorClose} severity="error" variant="filled">
          {errorMessage}
        </Alert>
      </Snackbar>
    </>
  )
}

export default Authenticated
