import React, { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import LinearProgress from '@mui/material/LinearProgress'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { BuildOptions, BuildTokenResponse } from '@types'
import { fetchBuildOptions, fetchBuildToken } from '@services/build-maker'
import ChannelCard from '@components/channel-card'
import CreateCard from './create-card'

export interface BuildCreateProps {
  buildId: string
  channelId: string
}

const BuildCreate = ({ buildId, channelId }: BuildCreateProps): JSX.Element => {
  const [buildOptions, setBuildOptions] = useState<BuildOptions | undefined>(undefined)
  const [buildTokenResponse, setBuildTokenResponse] = useState<BuildTokenResponse | undefined>(undefined)
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)
  const [loadingError, setLoadingError] = useState<string | undefined>(undefined)

  const isLoadingInitial = buildOptions === undefined || buildTokenResponse === undefined

  const renderInitialLoading = (): JSX.Element => {
    if (loadingError !== undefined) {
      return (
        <Typography sx={{ textAlign: 'center' }} variant="h5">
          {loadingError}
        </Typography>
      )
    }
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
      </Box>
    )
  }

  const snackbarErrorClose = (): void => {
    setErrorMessage(undefined)
  }

  useEffect(() => {
    fetchBuildOptions()
      .then(setBuildOptions)
      .catch((error) => {
        console.error('fetchBuildOptions', error)
        const message = 'Error fetching build options, please refresh the page to try again'
        setErrorMessage(message)
        setLoadingError(message)
      })
    fetchBuildToken(channelId, buildId)
      .then(setBuildTokenResponse)
      .catch((error) => {
        console.error('fetchBuildToken', error)
        const message = 'Error validating build token. Your link may have expired.'
        setErrorMessage(message)
        setLoadingError(message)
      })
  }, [])

  return (
    <>
      <Stack margin="auto" maxWidth="400px" spacing={4}>
        <Typography sx={{ textAlign: 'center' }} variant="h2">
          Create Build
        </Typography>
        <>
          <ChannelCard channelId={channelId} />
          <Divider />
        </>
        {isLoadingInitial ? (
          renderInitialLoading()
        ) : (
          <CreateCard
            buildId={buildId}
            buildOptions={buildOptions}
            buildTokenResponse={buildTokenResponse}
            channelId={channelId}
          />
        )}
      </Stack>
      <Snackbar autoHideDuration={20_000} onClose={snackbarErrorClose} open={errorMessage !== undefined}>
        <Alert onClose={snackbarErrorClose} severity="error" variant="filled">
          {errorMessage}
        </Alert>
      </Snackbar>
    </>
  )
}

export default BuildCreate
