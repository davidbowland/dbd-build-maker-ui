import React, { useEffect, useState } from 'react'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import LinearProgress from '@mui/material/LinearProgress'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Skeleton from '@mui/material/Skeleton'
import Snackbar from '@mui/material/Snackbar'
import Typography from '@mui/material/Typography'

import { BuildBatch, Channel } from '@types'
import { fetchAllBuilds, fetchChannel } from '@services/build-maker'
import { CardContent } from '@mui/material'

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
        {channelInfo.mods.length > 0 && renderMods(channelInfo.mods)}
      </Card>
    )
  }

  const renderLoading = (): JSX.Element => {
    return <Skeleton height={100} variant="text" width="100%" />
  }

  const renderMods = (mods: string[]): JSX.Element => (
    <CardContent>
      <Accordion>
        <AccordionSummary aria-controls="mods-content" expandIcon={<ExpandMoreIcon />}>
          <Typography variant="body1">Moderators</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List dense={true}>
            {mods.map((name, index) => (
              <ListItem key={index}>
                <ListItemText primary={name} />
              </ListItem>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>
    </CardContent>
  )

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
