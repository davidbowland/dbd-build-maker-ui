import React, { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CheckIcon from '@mui/icons-material/Check'
import CircularProgress from '@mui/material/CircularProgress'
import EditIcon from '@mui/icons-material/Edit'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import Skeleton from '@mui/material/Skeleton'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import jsonpatch from 'fast-json-patch'

import { BuildBatch, Channel, TwitchTokenStatus } from '@types'
import { fetchChannel, patchChannel } from '@services/build-maker'
import { getAccessToken } from '@services/auth'

const NO_INSTRUCTIONS_TEXT = 'No special instructions'

export interface ChannelCardProps {
  builds?: BuildBatch[]
  channelId: string
  tokenStatus?: TwitchTokenStatus
}

const ChannelCard = ({ builds, channelId, tokenStatus }: ChannelCardProps): JSX.Element => {
  const [channelInfo, setChannelInfo] = useState<Channel | undefined>(undefined)
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)
  const [instructions, setInstructions] = useState(NO_INSTRUCTIONS_TEXT)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const accessToken = getAccessToken()
  const isChannelMod =
    (channelInfo?.mods && channelInfo?.mods.some((value) => tokenStatus?.id === value.user_id)) ||
    channelId === tokenStatus?.id

  const handleSubmitClick = async (channelInfo: Channel, accessToken: string): Promise<void> => {
    setIsLoading(true)
    try {
      const notes = instructions === '' || instructions === NO_INSTRUCTIONS_TEXT ? undefined : instructions
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
          aria-label={`Details for ${channelInfo.name}`}
          avatar={<Avatar alt={channelInfo.name} src={channelInfo.pic} />}
          subheader={
            <>
              <Typography component="div" variant="caption">
                Pending builds: {channelInfo.counts.pending.toLocaleString()}
              </Typography>
              <Typography component="div" variant="caption">
                Completed builds: {channelInfo.counts.completed.toLocaleString()}
              </Typography>
            </>
          }
          title={<Typography variant="h6">{channelInfo.name}</Typography>}
        />
      </Card>
    )
  }

  const renderInstructions = (channelInfo: Channel): JSX.Element => {
    if (isEditing && accessToken) {
      return (
        <Alert severity="info" variant="filled">
          <Grid container spacing={1} sx={{ maxWidth: '100%', width: '600px' }}>
            <Grid item xs>
              <TextField
                disabled={isLoading}
                fullWidth
                label="Special instructions"
                name="special-instructions"
                onChange={(event) => setInstructions(event.target.value)}
                type="text"
                value={instructions}
                variant="filled"
              />
            </Grid>
            <Grid item xs="auto">
              <Tooltip title="Submit">
                <IconButton
                  aria-label="Submit"
                  disabled={isLoading}
                  onClick={() => handleSubmitClick(channelInfo, accessToken)}
                >
                  {isLoading ? <CircularProgress color="inherit" size={20} /> : <CheckIcon color="success" />}
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </Alert>
      )
    } else if (!isChannelMod && channelInfo.notes === undefined) {
      return <></>
    }
    return (
      <Alert severity={channelInfo.notes ? 'warning' : 'success'} variant="filled">
        <Grid container spacing={1} sx={{ maxWidth: '100%', width: '600px' }}>
          <Grid item xs>
            <Typography variant="body1">{channelInfo.notes ?? NO_INSTRUCTIONS_TEXT}</Typography>
          </Grid>
          {isChannelMod && accessToken && (
            <Grid item xs="auto">
              <Tooltip title="Edit special instructions">
                <IconButton aria-label="Edit instructions" onClick={() => setIsEditing(true)}>
                  <EditIcon />
                </IconButton>
              </Tooltip>
            </Grid>
          )}
        </Grid>
      </Alert>
    )
  }

  const renderLoading = (count: number): JSX.Element[] =>
    Array.from({ length: count }).map((_, index) => <Skeleton height={60} key={index} variant="rounded" width="100%" />)

  const snackbarErrorClose = (): void => {
    setErrorMessage(undefined)
  }

  useEffect(() => {
    setInstructions(channelInfo?.notes ?? NO_INSTRUCTIONS_TEXT)
  }, [channelInfo])

  useEffect(() => {
    fetchChannel(channelId)
      .then(setChannelInfo)
      .catch((error) => {
        console.error('fetchChannel', error)
        setErrorMessage('Error fetching channel details, please refresh the page to try again')
      })
  }, [builds])

  return (
    <Stack spacing={1}>
      {channelInfo === undefined ? (
        renderLoading(2)
      ) : (
        <>
          {renderCard(channelInfo)}
          {renderInstructions(channelInfo)}
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
