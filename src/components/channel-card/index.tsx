import React, { useEffect, useState } from 'react'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CheckIcon from '@mui/icons-material/Check'
import CircularProgress from '@mui/material/CircularProgress'
import EditIcon from '@mui/icons-material/Edit'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import LinearProgress from '@mui/material/LinearProgress'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Skeleton from '@mui/material/Skeleton'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import jsonpatch from 'fast-json-patch'

import { BuildBatch, Channel, TwitchTokenStatus } from '@types'
import { fetchAllBuilds, fetchChannel, patchChannel } from '@services/build-maker'
import { getAccessToken } from '@services/auth'

const NO_RESTRICTIONS_TEXT = 'No build restrictions'

export interface ChannelCardProps {
  channelId: string
  initialBuilds?: BuildBatch[]
  tokenStatus?: TwitchTokenStatus
}

const ChannelCard = ({ channelId, initialBuilds, tokenStatus }: ChannelCardProps): JSX.Element => {
  const [builds, setBuilds] = useState<BuildBatch[] | undefined>(initialBuilds)
  const [channelInfo, setChannelInfo] = useState<Channel | undefined>(undefined)
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [restrictions, setRestrictions] = useState(NO_RESTRICTIONS_TEXT)

  const accessToken = getAccessToken()
  const uncompletedBuildCount = builds?.reduce((count, build) => 1 - Math.sign(build.data.completed ?? 0) + count, 0)

  const handleSubmitClick = async (channelInfo: Channel, accessToken: string): Promise<void> => {
    setIsLoading(true)
    try {
      const notes = restrictions === '' || restrictions === NO_RESTRICTIONS_TEXT ? undefined : restrictions
      const newChannelInfo = { ...channelInfo, notes }
      const jsonPatchOperations = jsonpatch.compare(channelInfo, newChannelInfo, true)
      await patchChannel(channelId, jsonPatchOperations, accessToken)
      setChannelInfo(newChannelInfo)
      setIsEditing(false)
    } catch (error) {
      console.error('handleSubmitClick', error)
      setErrorMessage('Unable to save changes, please reload the page and try again')
    }
    setIsLoading(false)
  }

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

  const renderLoading = (count: number): JSX.Element[] => {
    return Array.from({ length: count }).map((_, index) => (
      <Skeleton height={100} key={index} variant="text" width="100%" />
    ))
  }

  const renderMods = (mods: string[]): JSX.Element => (
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
  )

  const renderRestrictions = (channelInfo: Channel): JSX.Element => {
    if (isEditing && accessToken) {
      return (
        <Alert severity="info" variant="filled">
          <Stack direction="row" spacing={1}>
            <TextField
              disabled={isLoading}
              fullWidth
              label="Build restrictions"
              name="build-restrictions"
              onChange={(event) => setRestrictions(event.target.value)}
              sx={{ maxWidth: '100%', width: '600px' }}
              type="text"
              value={restrictions}
              variant="filled"
            />
            <Box sx={{ minWidth: '25px' }}>
              {isLoading ? (
                <CircularProgress color="inherit" size={20} />
              ) : (
                <CheckIcon
                  aria-label="Submit restrictions"
                  color="success"
                  onClick={() => handleSubmitClick(channelInfo, accessToken)}
                />
              )}
            </Box>
          </Stack>
        </Alert>
      )
    }
    return (
      <Alert severity={channelInfo.notes ? 'warning' : 'success'} variant="filled">
        <Stack direction="row" spacing={1}>
          <Typography sx={{ maxWidth: '100%', width: '600px' }} variant="body1">
            {channelInfo.notes ?? 'No build restrictions'}
          </Typography>
          {tokenStatus?.id === channelId && accessToken && (
            <Box>
              <EditIcon aria-label="Edit restrictions" onClick={() => setIsEditing(true)} />
            </Box>
          )}
        </Stack>
      </Alert>
    )
  }

  const snackbarErrorClose = (): void => {
    setErrorMessage(undefined)
  }

  useEffect(() => {
    setRestrictions(channelInfo?.notes ?? NO_RESTRICTIONS_TEXT)
  }, [channelInfo])

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
    <Stack spacing={1}>
      {channelInfo === undefined ? (
        renderLoading(2)
      ) : (
        <>
          {renderCard(channelInfo)}
          {channelInfo.mods.length > 0 && renderMods(channelInfo.mods)}
          {renderRestrictions(channelInfo)}
        </>
      )}
      <Snackbar autoHideDuration={20_000} onClose={snackbarErrorClose} open={errorMessage !== undefined}>
        <Alert onClose={snackbarErrorClose} severity="error" variant="filled">
          {errorMessage}
        </Alert>
      </Snackbar>
    </Stack>
  )
}

export default ChannelCard
