import React, { useState } from 'react'
import Button from '@mui/material/Button'
import CancelIcon from '@mui/icons-material/Cancel'
import Card from '@mui/material/Card'
import CardActions from '@mui/material/CardActions'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import CircularProgress from '@mui/material/CircularProgress'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import jsonpatch from 'fast-json-patch'

import { Build, BuildBatch } from '@types'
import { patchBuild } from '@services/build-maker'

export interface BuildCardsProps {
  accessToken: string | null
  builds: BuildBatch[]
  channelId: string
  isChannelMod: boolean
  refreshBuilds: () => void
  setBuilds: (value: any) => void
  setErrorMessage: (value: string) => void
}

const BuildCards = ({
  accessToken,
  builds,
  channelId,
  isChannelMod,
  refreshBuilds,
  setBuilds,
  setErrorMessage,
}: BuildCardsProps): JSX.Element => {
  const [buildUpdating, setBuildUpdating] = useState<{ [key: string]: boolean }>({})

  const renderBuilds = (): JSX.Element[] => {
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
            <Typography variant="caption">Expires {new Date(build.data.expiration).toLocaleString()}</Typography>
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

  const setBuildCompleted = async (buildId: string, build: Build, completed?: number): Promise<void> => {
    setBuildUpdating({ ...buildUpdating, [buildId]: true })
    const { completed: _, ...buildNoCompleted } = build
    const updatedBuild = completed ? { ...buildNoCompleted, completed } : buildNoCompleted
    const jsonPatchOperations = jsonpatch.compare(build, updatedBuild, true)
    if (accessToken && builds) {
      try {
        await patchBuild(channelId, buildId, jsonPatchOperations, accessToken)
        setBuilds(
          (current: BuildBatch[]) =>
            current && [
              ...current.filter((build: BuildBatch) => build.id !== buildId),
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
    refreshBuilds()
  }

  return (
    <>
      {builds.length === 0 ? (
        <Typography sx={{ textAlign: 'center' }} variant="h5">
          No builds
        </Typography>
      ) : (
        renderBuilds()
      )}
    </>
  )
}

export default BuildCards
