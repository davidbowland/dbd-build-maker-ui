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
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
import InputLabel from '@mui/material/InputLabel'
import NativeSelect from '@mui/material/NativeSelect'
import { NativeSelectInputProps } from '@mui/material/NativeSelect/NativeSelectInput'
import { navigate } from 'gatsby'
import Skeleton from '@mui/material/Skeleton'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { ChannelBatch, TwitchTokenStatus } from '@types'
import { deleteChannel, fetchAllChannels } from '@services/build-maker'
import CreateButton from './create-button'
import { getAccessToken } from '@services/auth'
import SignUpCta from '@components/sign-up-cta'

// 30 minutes * 60 seconds * 1000 milliseconds = 1_800_000
const TRENDING_WINDOW_IN_SECONDS = 1_800_000

export interface ChannelListProps {
  tokenStatus?: TwitchTokenStatus
}

type SortFunction = (a: ChannelBatch, b: ChannelBatch) => number

enum ChannelSort {
  ALPHABETIC = 'alpha',
  BUILD_COUNT = 'builds',
  RECENT = 'recent',
  TRENDING = 'trending',
}

const ChannelList = ({ tokenStatus }: ChannelListProps): JSX.Element => {
  const [channels, setChannels] = useState<ChannelBatch[] | undefined>(undefined)
  const [channelFilter, setChannelFilter] = useState('')
  const [channelSort, setChannelSort] = useState<ChannelSort>(ChannelSort.TRENDING)
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showDeletePending, setShowDeletePending] = useState(false)

  const accessToken = getAccessToken()
  const hasChannel = tokenStatus && channels?.some((channel) => channel.id === tokenStatus?.id)

  const applyChannelFilter = (channel: ChannelBatch): boolean => {
    const channelName = channel.data.name.toLocaleLowerCase()
    return channelFilter.split(/[^a-z0-9]|\b/i).every((value) => channelName.indexOf(value.toLocaleLowerCase()) >= 0)
  }

  const deleteChannelClick = async (channelId: string, accessToken: string): Promise<void> => {
    try {
      setShowDeleteDialog(false)
      setShowDeletePending(true)
      await deleteChannel(channelId, accessToken)
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

  const getSortFunction = (value: ChannelSort): SortFunction => {
    if (value === ChannelSort.ALPHABETIC) {
      return sortChannelsAlpha
    } else if (value == ChannelSort.BUILD_COUNT) {
      return sortChannelsBuilds
    } else if (value === ChannelSort.RECENT) {
      return sortChannelsRecent
    } else {
      return sortChannelsTrending
    }
  }

  const renderChannels = (channels: ChannelBatch[]): JSX.Element[] =>
    channels
      .filter(applyChannelFilter)
      .sort(getSortFunction(channelSort))
      .map((channel, index) => {
        const yourChannel = tokenStatus && channel.id === tokenStatus.id
        return (
          <Card key={index}>
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
                title={<Typography variant="h6">{channel.data.name}</Typography>}
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

  const renderLoading = (): JSX.Element[] => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Skeleton height={100} key={index} variant="rounded" width="100%" />
    ))
  }

  const snackbarErrorClose = (): void => {
    setErrorMessage(undefined)
  }

  const sortChannelsAlpha: SortFunction = (a: ChannelBatch, b: ChannelBatch): number => {
    const [aBuildCount, bBuildCount] = [
      a.data.counts.completed + a.data.counts.pending,
      b.data.counts.completed + b.data.counts.pending,
    ]
    const [aLastModified, bLastModified] = [a.data.lastModified, b.data.lastModified]

    const result = a.data.name.localeCompare(b.data.name)
    if (
      result === -1 ||
      (result === 0 && (aBuildCount > bBuildCount || (aBuildCount === bBuildCount && aLastModified > bLastModified)))
    ) {
      return -1
    }
    return 1
  }

  const sortChannelsBuilds: SortFunction = (a: ChannelBatch, b: ChannelBatch): number => {
    const [aBuildCount, bBuildCount] = [
      a.data.counts.completed + a.data.counts.pending,
      b.data.counts.completed + b.data.counts.pending,
    ]
    const [aLastModified, bLastModified] = [a.data.lastModified, b.data.lastModified]

    if (aBuildCount > bBuildCount || (aBuildCount === bBuildCount && aLastModified > bLastModified)) {
      return -1
    }
    return 1
  }

  const sortChannelsRecent: SortFunction = (a: ChannelBatch, b: ChannelBatch): number => {
    if (a.data.lastModified > b.data.lastModified) {
      return -1
    }
    return 1
  }

  const sortChannelsTrending: SortFunction = (a: ChannelBatch, b: ChannelBatch): number => {
    const [aBuildCount, bBuildCount] = [
      Math.log(a.data.counts.completed + a.data.counts.pending),
      Math.log(b.data.counts.completed + b.data.counts.pending),
    ]
    const [aLastModified, bLastModified] = [
      Math.floor(a.data.lastModified / TRENDING_WINDOW_IN_SECONDS),
      Math.floor(b.data.lastModified / TRENDING_WINDOW_IN_SECONDS),
    ]

    const alphaResult = a.data.name.localeCompare(b.data.name)
    if (
      (aLastModified + aBuildCount === bLastModified + bBuildCount && alphaResult === -1) ||
      aLastModified + aBuildCount > bLastModified + bBuildCount
    ) {
      return -1
    }
    return 1
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
        <Grid container justifyContent="center" spacing={2} sx={{ paddingRight: 2, width: '100%' }}>
          <Grid item md={3} sm={5} xs={12}>
            <FormControl fullWidth>
              <InputLabel id="channel-sort-label">Channel order</InputLabel>
              <NativeSelect
                aria-labelledby="channel-sort-label"
                id="channel-sort"
                inputProps={{ 'data-testid': 'channel-sort' } as Partial<NativeSelectInputProps>}
                onChange={(event) => setChannelSort(event.target.value as ChannelSort)}
                sx={{ maxWidth: '95%' }}
                value={channelSort}
              >
                <option value={ChannelSort.ALPHABETIC}>Alphabetic</option>
                <option value={ChannelSort.BUILD_COUNT}>Build count</option>
                <option value={ChannelSort.RECENT}>Recent activity</option>
                <option value={ChannelSort.TRENDING}>Trending</option>
              </NativeSelect>
            </FormControl>
          </Grid>
          <Grid item xs></Grid>
          <Grid item md={4} sm={5} xs={12}>
            <label>
              <TextField
                fullWidth
                label="Search channels"
                name="channel-search"
                onChange={(event) => setChannelFilter(event.target.value)}
                type="text"
                value={channelFilter}
                variant="outlined"
              />
            </label>
          </Grid>
        </Grid>
        <Divider />
        <Grid container justifyContent="center" spacing={2} sx={{ paddingBottom: 2, paddingRight: 2, width: '100%' }}>
          {(channels ? renderChannels(channels) : renderLoading()).map((el, index) => (
            <Grid item key={index} lg={4} md={6} xs={12}>
              {el}
            </Grid>
          ))}
        </Grid>
        <Divider />
        {tokenStatus !== undefined && channels && !hasChannel && accessToken && (
          <CreateButton accessToken={accessToken} />
        )}
        {tokenStatus === undefined && <SignUpCta />}
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
          <Button onClick={() => tokenStatus?.id && accessToken && deleteChannelClick(tokenStatus.id, accessToken)}>
            Continue
          </Button>
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
