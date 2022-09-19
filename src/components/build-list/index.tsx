import React, { useEffect, useRef, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Fab from '@mui/material/Fab'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import KeyboardDoubleArrowUpRoundedIcon from '@mui/icons-material/KeyboardDoubleArrowUpRounded'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import ReplayIcon from '@mui/icons-material/Replay'
import Skeleton from '@mui/material/Skeleton'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import { BuildBatch, Channel, TwitchTokenStatus } from '@types'
import { fetchAllBuilds, fetchChannel, updateChannelMods } from '@services/build-maker'
import BuildCards from './build-cards'
import ChannelCard from '@components/channel-card'
import DisableList from '@components/disable-list'
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
  const [tabIndex, setTabIndex] = useState(0)

  const topRef = useRef<HTMLHRElement>(null)

  const accessToken = getAccessToken()
  const isChannelMod =
    (channel?.mods && channel?.mods.some((value) => tokenStatus?.name === value)) || channelId === tokenStatus?.id

  const formatRefreshCount = (refreshCount: number): string =>
    new Date((REFRESH_INTERVAL_SECONDS - refreshCount) * 1000).toISOString().replace(/^.*T(00:)?([^.]+).*$/, '$2')

  const handleTabChange = (event: React.SyntheticEvent, value: number) => setTabIndex(value)

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
      <Skeleton height={250} key={index} variant="rounded" width="100%" />
    ))
  }

  const renderMods = (mods: string[]): JSX.Element => (
    <List dense={true}>
      {mods.map((name, index) => (
        <ListItem key={index}>
          <ListItemText primary={name} />
        </ListItem>
      ))}
    </List>
  )

  const snackbarErrorClose = (): void => {
    setErrorMessage(undefined)
  }

  useEffect(() => {
    if (refreshCount >= REFRESH_INTERVAL_SECONDS) {
      refreshBuilds()
    }
  }, [refreshCount])

  useEffect(() => {
    if (channelId === tokenStatus?.id && accessToken) {
      updateChannelMods(channelId, accessToken).catch((error) => console.error('updateChannelMods', error))
    }
  }, [tokenStatus])

  useEffect(() => {
    fetchChannel(channelId)
      .then(setChannel)
      .catch((error) => {
        console.error('fetchChannel', error)
        setErrorMessage('Error fetching channel info, please refresh the page to try again')
      })

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
        <ChannelCard channelId={channelId} initialBuilds={builds} tokenStatus={tokenStatus} />
      </Stack>
      <Grid container ref={topRef} spacing={2} sx={{ paddingRight: 2, width: '100%' }}>
        <Grid item xs></Grid>
        <Grid container item spacing={1} sx={{ paddingRight: 1 }} xs="auto">
          {isChannelMod && accessToken && (
            <Grid item xs>
              <GenerateBuildUrl accessToken={accessToken} channelId={channelId} />
            </Grid>
          )}
          {isChannelMod && accessToken && (
            <Grid item xs>
              <DisableList accessToken={accessToken} channelId={channelId} />
            </Grid>
          )}
          <Grid item xs>
            <Tooltip title={isRefreshing ? 'Refreshing builds...' : 'Refresh builds'}>
              <IconButton disabled={isRefreshing} onClick={refreshBuilds}>
                {isRefreshing ? <CircularProgress color="inherit" size={14} /> : <ReplayIcon />}
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </Grid>
      <Grid container spacing={2} sx={{ paddingRight: 2, width: '100%' }}>
        <Grid item xs></Grid>
        <Grid item xs="auto">
          <Typography variant="caption">Automatic refresh in {formatRefreshCount(refreshCount)}</Typography>
        </Grid>
      </Grid>

      {builds ? (
        <Box sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs aria-label="Build selection tabs" onChange={handleTabChange} value={tabIndex} variant="fullWidth">
              <Tab
                label={`Pending builds (${builds.filter((build) => !build.data.completed).length.toLocaleString()})`}
              />
              <Tab
                label={`Completed builds (${builds.filter((build) => !!build.data.completed).length.toLocaleString()})`}
              />
              {channel && <Tab label={`Mods (${channel.mods.length.toLocaleString()})`} />}
            </Tabs>
          </Box>
          {tabIndex === 0 && (
            <Box sx={{ bgcolor: 'background.paper', p: 3 }}>
              <BuildCards
                accessToken={accessToken}
                builds={builds}
                channelId={channelId}
                isChannelMod={isChannelMod}
                pendingBuilds={true}
                refreshBuilds={refreshBuilds}
                setBuilds={setBuilds}
                setErrorMessage={setErrorMessage}
              />
            </Box>
          )}
          {tabIndex === 1 && (
            <Box sx={{ bgcolor: 'background.paper', p: 3 }}>
              <BuildCards
                accessToken={accessToken}
                builds={builds}
                channelId={channelId}
                isChannelMod={isChannelMod}
                pendingBuilds={false}
                refreshBuilds={refreshBuilds}
                setBuilds={setBuilds}
                setErrorMessage={setErrorMessage}
              />
            </Box>
          )}
          {channel && tabIndex === 2 && (
            <Box sx={{ bgcolor: 'background.paper', p: 3 }}>
              {channel.mods.length > 0 ? (
                renderMods(channel.mods)
              ) : (
                <Typography sx={{ textAlign: 'center' }} variant="h5">
                  No mods
                </Typography>
              )}
            </Box>
          )}
        </Box>
      ) : (
        renderLoading()
      )}
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
