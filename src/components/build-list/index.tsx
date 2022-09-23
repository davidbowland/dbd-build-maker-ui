import React, { useEffect, useRef, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Fab from '@mui/material/Fab'
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered'
import Grid from '@mui/material/Grid'
import GridViewIcon from '@mui/icons-material/GridView'
import IconButton from '@mui/material/IconButton'
import KeyboardDoubleArrowUpRoundedIcon from '@mui/icons-material/KeyboardDoubleArrowUpRounded'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import ReplayIcon from '@mui/icons-material/Replay'
import Skeleton from '@mui/material/Skeleton'
import Snackbar from '@mui/material/Snackbar'
import SortByAlphaIcon from '@mui/icons-material/SortByAlpha'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import ViewListIcon from '@mui/icons-material/ViewList'

import { BuildBatch, Channel, TwitchTokenStatus } from '@types'
import { fetchAllBuilds, fetchChannel, updateChannelMods } from '@services/build-maker'
import BuildCards from './build-cards'
import BuildTable from './build-table'
import ChannelCard from '@components/channel-card'
import DisableList from '@components/disable-list'
import GenerateBuildUrl from '@components/generate-build-url'
import { getAccessToken } from '@services/auth'

const REFRESH_INTERVAL_SECONDS = parseInt(process.env.GATSBY_REFRESH_INTERVAL_SECONDS, 10)

export interface BuildListProps {
  channelId: string
  tokenStatus?: TwitchTokenStatus
}

enum BuildView {
  PENDING_BUILDS = 'pending',
  COMPLETED_BUILDS = 'completed',
  MODS = 'mods',
}

enum DisplayView {
  GRID_VIEW = 'grid',
  LIST_VIEW = 'list',
}

enum BuildsSorted {
  ALPHA_SORT = 'sorted',
  UNSORTED = 'unsorted',
}

const BuildList = ({ channelId, tokenStatus }: BuildListProps): JSX.Element => {
  const [builds, setBuilds] = useState<BuildBatch[] | undefined>(undefined)
  const [buildsSorted, setBuildsSorted] = useState<BuildsSorted>(BuildsSorted.UNSORTED)
  const [channel, setChannel] = useState<Channel | undefined>(undefined)
  const [displayView, setDisplayView] = useState<DisplayView>(DisplayView.GRID_VIEW)
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshCount, setRefreshCount] = useState(0)
  const [tabIndex, setTabIndex] = useState<BuildView>(BuildView.PENDING_BUILDS)

  const topRef = useRef<HTMLHRElement>(null)

  const accessToken = getAccessToken()
  const isChannelMod =
    (channel?.mods && channel?.mods.some((value) => tokenStatus?.name === value)) || channelId === tokenStatus?.id

  const filterAndSortBuilds = (builds: BuildBatch[], pendingBuilds: boolean): BuildBatch[] => {
    if (pendingBuilds) {
      return builds.filter((build) => !build.data.completed).sort((a, b) => a.data.expiration - b.data.expiration)
    } else {
      return builds.filter((build) => !!build.data.completed).sort((a, b) => b.data.completed! - a.data.completed!)
    }
  }

  const formatRefreshCount = (refreshCount: number): string =>
    new Date((REFRESH_INTERVAL_SECONDS - refreshCount) * 1000).toISOString().replace(/^.*T(00:)?([^.]+).*$/, '$2')

  const handleTabChange = (event: React.SyntheticEvent, value: BuildView) => setTabIndex(value)

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

  const sortAlphaCompareFn = (a: string, b: string): number => {
    if (a === b) {
      return 0
    } else if ((a === 'Any' || a === 'None') && b !== 'Any' && b !== 'None') {
      return 1
    } else if ((b === 'Any' || b === 'None') && a !== 'Any' && a !== 'None') {
      return -1
    } else if (a < b) {
      return -1
    }
    return 1
  }

  const unsortedCompareFn = (): number => -1

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

  const sortCompareFn = buildsSorted === BuildsSorted.ALPHA_SORT ? sortAlphaCompareFn : unsortedCompareFn
  return (
    <>
      <Stack margin="auto" marginBottom="50px" maxWidth="600px" spacing={4}>
        <Typography sx={{ textAlign: 'center' }} variant="h2">
          Builds
        </Typography>
        <ChannelCard channelId={channelId} initialBuilds={builds} tokenStatus={tokenStatus} />
      </Stack>
      <Grid container ref={topRef} spacing={2} sx={{ paddingRight: 2, width: '100%' }}>
        <Grid container item spacing={1} sx={{ paddingRight: 1 }} xs="auto">
          <Grid item xs>
            {displayView === DisplayView.GRID_VIEW ? (
              <Tooltip title="List view">
                <IconButton aria-label="List view" onClick={() => setDisplayView(DisplayView.LIST_VIEW)}>
                  <ViewListIcon />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="Grid view">
                <IconButton aria-label="Grid view" onClick={() => setDisplayView(DisplayView.GRID_VIEW)}>
                  <GridViewIcon />
                </IconButton>
              </Tooltip>
            )}
          </Grid>
          <Grid item xs>
            {buildsSorted === BuildsSorted.ALPHA_SORT ? (
              <Tooltip title="Show addons and perk in submitted order">
                <IconButton
                  aria-label="Show addons and perk in submitted order"
                  onClick={() => setBuildsSorted(BuildsSorted.UNSORTED)}
                >
                  <FormatListNumberedIcon />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="Sort addons and perks">
                <IconButton aria-label="Sort addons and perks" onClick={() => setBuildsSorted(BuildsSorted.ALPHA_SORT)}>
                  <SortByAlphaIcon />
                </IconButton>
              </Tooltip>
            )}
          </Grid>
        </Grid>
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
              <IconButton aria-label="Refresh builds" disabled={isRefreshing} onClick={refreshBuilds}>
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
        <TabContext value={tabIndex}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <TabList aria-label="Build tabs" onChange={handleTabChange} variant="fullWidth">
              <Tab
                label={`Pending builds (${builds.filter((build) => !build.data.completed).length.toLocaleString()})`}
                value={BuildView.PENDING_BUILDS}
              />
              <Tab
                label={`Completed builds (${builds.filter((build) => !!build.data.completed).length.toLocaleString()})`}
                value={BuildView.COMPLETED_BUILDS}
              />
              {channel && <Tab label={`Mods (${channel.mods.length.toLocaleString()})`} value={BuildView.MODS} />}
            </TabList>
          </Box>
          <TabPanel value={BuildView.PENDING_BUILDS}>
            {displayView === DisplayView.GRID_VIEW ? (
              <BuildCards
                accessToken={accessToken}
                builds={filterAndSortBuilds(builds, true)}
                channelId={channelId}
                isChannelMod={isChannelMod}
                refreshBuilds={refreshBuilds}
                setBuilds={setBuilds}
                setErrorMessage={setErrorMessage}
                sortCompareFn={sortCompareFn}
              />
            ) : (
              <BuildTable
                accessToken={accessToken}
                builds={filterAndSortBuilds(builds, true)}
                channelId={channelId}
                isChannelMod={isChannelMod}
                refreshBuilds={refreshBuilds}
                setBuilds={setBuilds}
                setErrorMessage={setErrorMessage}
                sortCompareFn={sortCompareFn}
              />
            )}
          </TabPanel>
          <TabPanel value={BuildView.COMPLETED_BUILDS}>
            {displayView === DisplayView.GRID_VIEW ? (
              <BuildCards
                accessToken={accessToken}
                builds={filterAndSortBuilds(builds, false)}
                channelId={channelId}
                isChannelMod={isChannelMod}
                refreshBuilds={refreshBuilds}
                setBuilds={setBuilds}
                setErrorMessage={setErrorMessage}
                sortCompareFn={sortCompareFn}
              />
            ) : (
              <BuildTable
                accessToken={accessToken}
                builds={filterAndSortBuilds(builds, false)}
                channelId={channelId}
                isChannelMod={isChannelMod}
                refreshBuilds={refreshBuilds}
                setBuilds={setBuilds}
                setErrorMessage={setErrorMessage}
                sortCompareFn={sortCompareFn}
              />
            )}
          </TabPanel>
          {channel && (
            <TabPanel value={BuildView.MODS}>
              {channel.mods.length > 0 ? (
                renderMods(channel.mods)
              ) : (
                <Typography sx={{ minHeight: '50vh', textAlign: 'center' }} variant="h5">
                  No mods
                </Typography>
              )}
            </TabPanel>
          )}
        </TabContext>
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
