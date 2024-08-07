import React, { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Skeleton from '@mui/material/Skeleton'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { BuildOptions, BuildTokenResponse, Channel, TwitchTokenStatus } from '@types'
import { fetchBuildOptions, fetchBuildToken, fetchChannel } from '@services/build-maker'
import ChannelCard from '@components/channel-card'
import CreateCard from './create-card'

export interface BuildCreateProps {
  buildId: string
  channelId: string
  tokenStatus?: TwitchTokenStatus
}

const BuildCreate = ({ buildId, channelId, tokenStatus }: BuildCreateProps): JSX.Element => {
  const [buildOptions, setBuildOptions] = useState<BuildOptions | undefined>()
  const [buildTokenResponse, setBuildTokenResponse] = useState<BuildTokenResponse | undefined>()
  const [channel, setChannel] = useState<Channel | undefined>()
  const [errorMessage, setErrorMessage] = useState<string | undefined>()
  const [loadingError, setLoadingError] = useState<string | undefined>()

  const isLoadingInitial = buildOptions === undefined || buildTokenResponse === undefined || channel === undefined

  const renderInitialLoading = (): JSX.Element => {
    if (loadingError !== undefined) {
      return (
        <Typography sx={{ textAlign: 'center' }} variant="h5">
          {loadingError}
        </Typography>
      )
    }
    return <Skeleton height={450} variant="rounded" width="100%" />
  }

  const snackbarErrorClose = (): void => {
    setErrorMessage(undefined)
  }

  useEffect(() => {
    fetchBuildOptions()
      .then(setBuildOptions)
      .catch((error) => {
        console.error('fetchBuildOptions', { error })
        const message = 'Error fetching build options, please refresh the page to try again'
        setErrorMessage(message)
        setLoadingError(message)
      })
    fetchBuildToken(channelId, buildId)
      .then(setBuildTokenResponse)
      .catch((error) => {
        console.error('fetchBuildToken', { buildId, channelId, error })
        const message = 'Error validating build token. Your link may have expired.'
        setErrorMessage(message)
        setLoadingError(message)
      })
    fetchChannel(channelId)
      .then(setChannel)
      .catch((error) => {
        console.error('fetchChannel', { channelId, error })
        const message = 'Error fetching channel details, please refresh the page to try again'
        setErrorMessage(message)
        setLoadingError(message)
      })
  }, [])

  return (
    <>
      <Stack margin="auto" maxWidth="600px" spacing={8}>
        <ChannelCard channelId={channelId} tokenStatus={tokenStatus} />
        {isLoadingInitial ? (
          renderInitialLoading()
        ) : (
          <CreateCard
            buildId={buildId}
            buildOptions={buildOptions}
            buildTokenResponse={buildTokenResponse}
            channel={channel}
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
