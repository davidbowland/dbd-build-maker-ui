import React, { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import LinearProgress from '@mui/material/LinearProgress'
import Skeleton from '@mui/material/Skeleton'
import Snackbar from '@mui/material/Snackbar'

import { BuildBatch, Channel } from '@types'
import { fetchAllBuilds, fetchChannel } from '@services/build-maker'

export interface ChannelCardProps {
  channelId: string
  initialBuilds?: BuildBatch[]
}

const ChannelCard = ({ channelId, initialBuilds }: ChannelCardProps): JSX.Element => {
  const [builds, setBuilds] = useState<BuildBatch[] | undefined>(initialBuilds)
  const [channelInfo, setChannelInfo] = useState<Channel | undefined>(undefined)
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)

  const uncompletedBuildCount = builds?.reduce((count, build) => 1 - Math.sign(build.data.completed ?? 0) + count, 0)

  const renderCard = (channelInfo: Channel): JSX.Element => {
    return (
      <Card sx={{ maxWidth: 600 }} variant="outlined">
        <CardHeader
          aria-label={`Information about ${channelInfo.name}`}
          avatar={<Avatar alt={channelInfo.name} src={channelInfo.pic} />}
          subheader={
            uncompletedBuildCount !== undefined ? (
              `Pending builds: ${uncompletedBuildCount.toLocaleString()}`
            ) : (
              <LinearProgress />
            )
          }
          title={channelInfo.name}
        />
      </Card>
    )
  }

  const renderLoading = (): JSX.Element => {
    return <Skeleton height={100} variant="text" width="100%" />
  }

  const snackbarErrorClose = (): void => {
    setErrorMessage(undefined)
  }

  useEffect(() => {
    if (builds === undefined) {
      fetchAllBuilds(channelId)
        .then(setBuilds)
        .catch((error) => {
          console.error('fetchAllBuilds', error)
          setErrorMessage('Error fetching build information, please refresh the page to try again')
        })
    } else {
      setBuilds(initialBuilds)
    }
  }, [initialBuilds])

  useEffect(() => {
    fetchChannel(channelId)
      .then(setChannelInfo)
      .catch((error) => {
        console.error('fetchChannel', error)
        setErrorMessage('Error fetching channel information, please refresh the page to try again')
      })
  }, [])

  return (
    <>
      {channelInfo ? renderCard(channelInfo) : renderLoading()}
      <Snackbar autoHideDuration={20_000} onClose={snackbarErrorClose} open={errorMessage !== undefined}>
        <Alert onClose={snackbarErrorClose} severity="error" variant="filled">
          {errorMessage}
        </Alert>
      </Snackbar>
    </>
  )
}

export default ChannelCard
