import React, { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardActions from '@mui/material/CardActions'
import CardHeader from '@mui/material/CardHeader'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import Skeleton from '@mui/material/Skeleton'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { ChannelBatch, TwitchTokenStatus } from '@types'
import { deleteChannel, fetchAllChannels } from '@services/build-maker'
import CreateButton from './create-button'
import SignUpCta from '@components/sign-up-cta'
import { getAccessToken } from '@services/auth'
import { navigate } from 'gatsby'

export interface ChannelListProps {
  tokenStatus?: TwitchTokenStatus
}

const ChannelList = ({ tokenStatus }: ChannelListProps): JSX.Element => {
  const [channels, setChannels] = useState<ChannelBatch[] | undefined>(undefined)
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showDeletePending, setShowDeletePending] = useState(false)

  const accessToken = getAccessToken()
  const hasChannel = tokenStatus && channels?.some((channel) => channel.id === tokenStatus?.id)

  const deleteChannelClick = async (): Promise<void> => {
    try {
      setShowDeleteDialog(false)
      setShowDeletePending(true)
      await deleteChannel(tokenStatus!.id!, accessToken!)
      window.location.reload()
    } catch (error) {
      console.error('deleteChannelClick', error)
      setErrorMessage('Error deleting channel')
      setShowDeletePending(false)
    }
  }

  const deleteDialogClose = (): void => {
    setShowDeleteDialog(false)
  }

  const renderChannels = (channels: ChannelBatch[]): JSX.Element[] => {
    return channels
      .sort((a, b) => a.data.name.localeCompare(b.data.name))
      .map((channel, index) => {
        const yourChannel = tokenStatus && channel.id === tokenStatus.id
        return (
          <Card key={index} sx={{ maxWidth: 600 }} variant="outlined">
            <CardActionArea>
              <CardHeader
                aria-label={`Link to ${channel.data.name}`}
                avatar={<Avatar alt={channel.data.name} src={channel.data.pic} />}
                onClick={() => navigate(`/c/${channel.id}`)}
                subheader={
                  <>
                    <Typography component="div" variant="caption">
                      Pending builds: {channel.data.counts.pending.toLocaleString()}
                    </Typography>
                    <Typography component="div" variant="caption">
                      Completed builds: {channel.data.counts.completed.toLocaleString()}
                    </Typography>
                  </>
                }
                title={channel.data.name}
              />
            </CardActionArea>
            {yourChannel && (
              <CardActions>
                <Button
                  disabled={showDeletePending}
                  fullWidth
                  onClick={() => setShowDeleteDialog(true)}
                  size="small"
                  startIcon={showDeletePending ? <CircularProgress color="inherit" size={14} /> : null}
                >
                  {showDeletePending ? 'Deleting channel...' : 'Delete channel'}
                </Button>
              </CardActions>
            )}
          </Card>
        )
      })
  }

  const renderLoading = (): JSX.Element[] => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Skeleton height={100} key={index} variant="rounded" width="100%" />
    ))
  }

  const snackbarErrorClose = (): void => {
    setErrorMessage(undefined)
  }

  useEffect(() => {
    fetchAllChannels()
      .then(setChannels)
      .catch((error) => {
        console.error('fetchAllChannels', error)
        setErrorMessage('Error fetching channel list, please refresh the page to try again')
      })
  }, [])

  return (
    <>
      <Stack spacing={4} sx={{ minHeight: '70vh', width: '100%' }}>
        <Typography sx={{ textAlign: 'center' }} variant="h2">
          Channels
        </Typography>
        {tokenStatus !== undefined && channels && !hasChannel && accessToken && (
          <>
            <CreateButton accessToken={accessToken} />
            <Divider />
          </>
        )}
        <Grid container justifyContent="center" spacing={2} sx={{ paddingBottom: 2, paddingRight: 2, width: '100%' }}>
          {(channels ? renderChannels(channels) : renderLoading()).map((el, index) => (
            <Grid item key={index} lg={4} md={6} xs={12}>
              {el}
            </Grid>
          ))}
        </Grid>
        {tokenStatus === undefined && (
          <>
            <Divider />
            <SignUpCta />
          </>
        )}
      </Stack>
      <Dialog
        aria-describedby="Are you sure you want to delete the channel?"
        aria-labelledby="Delete channel dialog"
        onClose={deleteDialogClose}
        open={showDeleteDialog}
      >
        <DialogTitle id="alert-dialog-title">Delete channel?</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete your channel? To protect from accidents, builds will not be immediately
            deleted but will expire as normal.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={deleteDialogClose}>
            Go back
          </Button>
          <Button onClick={deleteChannelClick}>Continue</Button>
        </DialogActions>
      </Dialog>
      <Snackbar autoHideDuration={20_000} onClose={snackbarErrorClose} open={errorMessage !== undefined}>
        <Alert onClose={snackbarErrorClose} severity="error" variant="filled">
          {errorMessage}
        </Alert>
      </Snackbar>
    </>
  )
}

export default ChannelList
