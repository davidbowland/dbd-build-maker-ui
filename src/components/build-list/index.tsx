import React, { useEffect, useRef, useState } from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Fab from '@mui/material/Fab'
import KeyboardDoubleArrowUpRoundedIcon from '@mui/icons-material/KeyboardDoubleArrowUpRounded'
import Skeleton from '@mui/material/Skeleton'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { BuildBatch, Channel, TwitchTokenStatus } from '@types'
import { createChannel, fetchAllBuilds, fetchChannel } from '@services/build-maker'
import BuildCards from './build-cards'
import ChannelCard from '@components/channel-card'
import GenerateBuildUrl from '@components/generate-build-url'
import { getAccessToken } from '@services/auth'

const REFRESH_INTERVAL_SECONDS = parseInt(process.env.GATSBY_REFRESH_INTERVAL_SECONDS, 10)

export interface BuildListProps {
  channelId: string
  tokenStatus?: TwitchTokenStatus
}

const BuildList = ({ channelId, tokenStatus }: BuildListProps): JSX.Element => {
  const [builds, setBuilds] = useState<BuildBatch[] | undefined>(undefined)
  const [channel, setChannel] = useState<Channel | undefined>(undefined)
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshCount, setRefreshCount] = useState(0)

  const topRef = useRef<HTMLHRElement>(null)

  const accessToken = getAccessToken()
  const isChannelMod =
    (channel?.mods && channel?.mods.some((value) => tokenStatus?.name === value)) || channelId === tokenStatus?.id

  const refreshBuilds = (): void => {
    setIsRefreshing(true)
    setRefreshCount(0)
    fetchAllBuilds(channelId)
      .then(setBuilds)
      .catch((error) => {
        console.error('refreshBuilds', error)
        setErrorMessage('Error fetching build list, please refresh the page to try again')
      })
      .then(() => setIsRefreshing(false))
  }

  const renderLoading = (): JSX.Element[] => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Skeleton height={100} key={index} variant="text" width="100%" />
    ))
  }

  const snackbarErrorClose = (): void => {
    setErrorMessage(undefined)
  }

  useEffect(() => {
    if (refreshCount >= REFRESH_INTERVAL_SECONDS) {
      refreshBuilds()
    }
  }, [refreshCount])

  useEffect(() => {
    fetchChannel(channelId)
      .then(setChannel)
      .catch((error) => {
        console.error('fetchChannel', error)
        setErrorMessage('Error fetching channel info, please refresh the page to try again')
      })

    // Recreate this channel if the user owns it to update mods
    if (channelId === tokenStatus?.id && accessToken) {
      createChannel(accessToken).catch((error) => console.error('createChannel', error))
    }

    refreshBuilds()
    const timer = window.setInterval(() => setRefreshCount((refreshCount) => refreshCount + 1), 1_000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <>
      <Stack margin="auto" marginBottom="50px" maxWidth="600px" spacing={4}>
        <Typography sx={{ textAlign: 'center' }} variant="h2">
          Builds
        </Typography>
        <Stack ref={topRef} spacing={8}>
          <ChannelCard channelId={channelId} initialBuilds={builds} tokenStatus={tokenStatus} />
          <Stack spacing={2}>
            {isChannelMod && accessToken && <GenerateBuildUrl accessToken={accessToken} channelId={channelId} />}
            <Button
              disabled={isRefreshing}
              fullWidth
              onClick={refreshBuilds}
              size="small"
              startIcon={
                isRefreshing ? (
                  <CircularProgress color="inherit" size={14} />
                ) : (
                  <CircularProgress
                    color="inherit"
                    size={14}
                    value={(100 * refreshCount) / REFRESH_INTERVAL_SECONDS}
                    variant="determinate"
                  />
                )
              }
              variant="contained"
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </Stack>
        </Stack>
        {builds ? (
          <BuildCards
            accessToken={accessToken}
            builds={builds}
            channelId={channelId}
            isChannelMod={isChannelMod}
            refreshBuilds={refreshBuilds}
            setBuilds={setBuilds}
            setErrorMessage={setErrorMessage}
          />
        ) : (
          renderLoading()
        )}
      </Stack>
      <Fab
        aria-label="Scroll to top"
        color="secondary"
        onClick={() => topRef.current && topRef.current.scrollIntoView()}
        sx={{ bottom: 16, position: 'fixed', right: 16 }}
      >
        <KeyboardDoubleArrowUpRoundedIcon />
      </Fab>
      <Snackbar autoHideDuration={20_000} onClose={snackbarErrorClose} open={errorMessage !== undefined}>
        <Alert onClose={snackbarErrorClose} severity="error" variant="filled">
          {errorMessage}
        </Alert>
      </Snackbar>
    </>
  )
}

export default BuildList
