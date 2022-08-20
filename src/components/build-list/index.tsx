import React, { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import CancelIcon from '@mui/icons-material/Cancel'
import Card from '@mui/material/Card'
import CardActions from '@mui/material/CardActions'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Skeleton from '@mui/material/Skeleton'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import jsonpatch from 'fast-json-patch'

import { Build, BuildBatch, Channel, TwitchTokenStatus } from '@types'
import { fetchAllBuilds, fetchChannel, patchBuild } from '@services/build-maker'
import ChannelCard from '@components/channel-card'
import GenerateBuildUrl from '@components/generate-build-url'
import { getAccessToken } from '@services/auth'

export interface BuildListProps {
  channelId: string
  tokenStatus?: TwitchTokenStatus
}

const BuildList = ({ channelId, tokenStatus }: BuildListProps): JSX.Element => {
  const [builds, setBuilds] = useState<BuildBatch[] | undefined>(undefined)
  const [buildUpdating, setBuildUpdating] = useState<{ [key: string]: boolean }>({})
  const [channel, setChannel] = useState<Channel | undefined>(undefined)
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)

  const accessToken = getAccessToken()
  const isChannelMod =
    (channel?.mods && channel?.mods.some((value) => tokenStatus?.name === value)) || channelId === tokenStatus?.id

  const renderBuilds = (builds: BuildBatch[]): JSX.Element[] => {
    if (builds.length === 0) {
      return [
        <>
          <Typography sx={{ textAlign: 'center' }} variant="h5">
            No builds
          </Typography>
        </>,
      ]
    }
    return builds
      .sort(
        (a, b) =>
          Math.sign(a.data.completed ?? 0) - Math.sign(b.data.completed ?? 0) ||
          (b.data.completed ?? 0) - (a.data.completed ?? 0) ||
          a.data.expiration - b.data.expiration
      )
      .map((build, index) => (
        <Card key={index} sx={{ maxWidth: 600 }} variant="outlined">
          <CardHeader
            avatar={build.data.completed ? <CheckCircleOutlineIcon color="success" /> : <CancelIcon color="error" />}
            subheader={
              build.data.completed ? `Completed ${new Date(build.data.completed).toLocaleString()}` : 'Incomplete'
            }
            title={build.data.character}
          />
          <CardContent>
            {build.data.item && (
              <>
                <Typography variant="h6">Item</Typography>
                <List>
                  <ListItem>
                    <ListItemText primary={build.data.item} />
                  </ListItem>
                </List>
              </>
            )}
            {build.data.item !== 'None' && (
              <>
                <Typography variant="h6">Addons</Typography>
                <List dense={true}>
                  <ListItem>
                    <ListItemText primary={build.data.addon1} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary={build.data.addon2} />
                  </ListItem>
                </List>
              </>
            )}
            <>
              <Typography variant="h6">Offering</Typography>
              <List dense={true}>
                <ListItem>
                  <ListItemText primary={build.data.offering} />
                </ListItem>
              </List>
            </>
            <>
              <Typography variant="h6">Perks</Typography>
              <List dense={true}>
                <ListItem>
                  <ListItemText primary={build.data.perk1} />
                </ListItem>
                <ListItem>
                  <ListItemText primary={build.data.perk2} />
                </ListItem>
                <ListItem>
                  <ListItemText primary={build.data.perk3} />
                </ListItem>
                <ListItem>
                  <ListItemText primary={build.data.perk4} />
                </ListItem>
              </List>
            </>
            {build.data.notes && (
              <>
                <Typography variant="h6">Notes</Typography>
                <List dense={true}>
                  <ListItem>
                    <ListItemText primary={build.data.notes} />
                  </ListItem>
                </List>
              </>
            )}
            <>
              <Typography variant="h6">Submitted by</Typography>
              <List dense={true}>
                <ListItem>
                  <ListItemText primary={build.data.submitter} />
                </ListItem>
              </List>
            </>
          </CardContent>
          {renderCardAction(build.id, build.data)}
        </Card>
      ))
  }

  const renderCardAction = (buildId: string, build: Build): JSX.Element | null => {
    if (!isChannelMod) {
      return null
    } else if (buildUpdating[buildId]) {
      return (
        <CardActions>
          <Button disabled={true} fullWidth size="small" startIcon={<CircularProgress color="inherit" size={14} />}>
            Loading
          </Button>
        </CardActions>
      )
    } else if (build.completed) {
      return (
        <CardActions>
          <Button fullWidth onClick={() => setBuildCompleted(buildId, build, undefined)} size="small">
            Unmark complete
          </Button>
        </CardActions>
      )
    }
    return (
      <CardActions>
        <Button fullWidth onClick={() => setBuildCompleted(buildId, build, new Date().getTime())} size="small">
          Mark complete
        </Button>
      </CardActions>
    )
  }

  const renderLoading = (): JSX.Element[] => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Skeleton height={100} key={index} variant="text" width="100%" />
    ))
  }

  const setBuildCompleted = async (buildId: string, build: Build, completed?: number): Promise<void> => {
    setBuildUpdating({ ...buildUpdating, [buildId]: true })
    const { completed: _, ...buildNoCompleted } = build
    const updatedBuild = completed ? { ...buildNoCompleted, completed } : buildNoCompleted
    const jsonPatchOperations = jsonpatch.compare(build, updatedBuild, true)
    if (accessToken && builds) {
      try {
        await patchBuild(channelId, buildId, jsonPatchOperations, accessToken)
        setBuilds(
          (current) =>
            current && [
              ...current.filter((build) => build.id !== buildId),
              { channelId, data: updatedBuild, id: buildId },
            ]
        )
      } catch (error) {
        console.error('setBuildCompleted', error)
        setErrorMessage('Error updating build')
      }
    }

    setBuildUpdating((current) => {
      const { [buildId]: _, ...newBuildUpdating } = current
      return newBuildUpdating
    })
  }

  const snackbarErrorClose = (): void => {
    setErrorMessage(undefined)
  }

  useEffect((): void => {
    fetchAllBuilds(channelId)
      .then(setBuilds)
      .catch((error) => {
        console.error('fetchAllBuilds', error)
        setErrorMessage('Error fetching build list, please refresh the page to try again')
      })
    fetchChannel(channelId)
      .then(setChannel)
      .catch((error) => {
        console.error('fetchChannel', error)
        setErrorMessage('Error fetching channel info, please refresh the page to try again')
      })
  }, [])

  return (
    <>
      <Stack margin="auto" maxWidth="400px" spacing={4}>
        <Typography sx={{ textAlign: 'center' }} variant="h2">
          Builds
        </Typography>
        <>
          <ChannelCard channelId={channelId} initialBuilds={builds} />
          <Divider />
        </>
        {isChannelMod && accessToken && (
          <>
            <GenerateBuildUrl accessToken={accessToken} channelId={channelId} />
            <Divider />
          </>
        )}
        {builds ? renderBuilds(builds) : renderLoading()}
      </Stack>
      <Snackbar autoHideDuration={20_000} onClose={snackbarErrorClose} open={errorMessage !== undefined}>
        <Alert onClose={snackbarErrorClose} severity="error" variant="filled">
          {errorMessage}
        </Alert>
      </Snackbar>
    </>
  )
}

export default BuildList
