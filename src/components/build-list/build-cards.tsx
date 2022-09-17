import React, { useState } from 'react'
import Button from '@mui/material/Button'
import CancelIcon from '@mui/icons-material/Cancel'
import Card from '@mui/material/Card'
import CardActions from '@mui/material/CardActions'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import jsonpatch from 'fast-json-patch'

import { Build, BuildBatch } from '@types'
import { patchBuild } from '@services/build-maker'

export interface BuildCardsProps {
  accessToken: string | null
  builds: BuildBatch[]
  channelId: string
  isChannelMod: boolean
  pendingBuilds: boolean
  refreshBuilds: () => void
  setBuilds: (value: any) => void
  setErrorMessage: (value: string) => void
}

const BuildCards = ({
  accessToken,
  builds,
  channelId,
  isChannelMod,
  pendingBuilds,
  refreshBuilds,
  setBuilds,
  setErrorMessage,
}: BuildCardsProps): JSX.Element => {
  const [buildUpdating, setBuildUpdating] = useState<{ [key: string]: boolean }>({})

  const filterAndSortBuilds = (builds: BuildBatch[]): BuildBatch[] => {
    if (pendingBuilds) {
      return builds.filter((build) => !build.data.completed).sort((a, b) => a.data.expiration - b.data.expiration)
    } else {
      return builds.filter((build) => !!build.data.completed).sort((a, b) => b.data.completed! - a.data.completed!)
    }
  }

  const renderBuilds = (builds: BuildBatch[]): JSX.Element[] => {
    return builds.map((build, index) => (
      <Card key={index} sx={{ boxShadow: 20, maxWidth: 600 }} variant="outlined">
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
              <Typography variant="body2">{renderSortedList(build.data.item)}</Typography>
            </>
          )}
          {build.data.item !== 'None' && (
            <>
              <Typography variant="h6">Addons</Typography>
              <Typography variant="body2">{renderSortedList(build.data.addon1, build.data.addon2)}</Typography>
            </>
          )}
          <>
            <Typography variant="h6">Offering</Typography>
            <Typography variant="body2">{renderSortedList(build.data.offering)}</Typography>
          </>
          <>
            <Typography variant="h6">Perks</Typography>
            <Typography variant="body2">
              {renderSortedList(build.data.perk1, build.data.perk2, build.data.perk3, build.data.perk4)}
            </Typography>
          </>
          {build.data.notes && (
            <>
              <Typography variant="h6">Notes</Typography>
              <Typography variant="body2">
                <ul style={{ listStyle: 'none' }}>
                  <li>{build.data.notes}</li>
                </ul>
              </Typography>
            </>
          )}
          <>
            <Typography variant="h6">Submitted by</Typography>
            <Typography variant="body2">
              <ul style={{ listStyle: 'none' }}>
                <li>{build.data.submitter}</li>
              </ul>
            </Typography>
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

  const renderSortedList = (...args: string[]): JSX.Element => (
    <ul>
      {args.sort().map((value, index) => (
        <li key={index}>{value}</li>
      ))}
    </ul>
  )

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
        setErrorMessage('Error updating build, please refresh the page as the build may have changed')
      }
    }

    setBuildUpdating((current) => {
      const { [buildId]: _, ...newBuildUpdating } = current
      return newBuildUpdating
    })
    refreshBuilds()
  }

  const sortedBuilds = filterAndSortBuilds(builds)
  return (
    <Stack spacing={4}>
      {sortedBuilds.length === 0 ? (
        <Typography sx={{ textAlign: 'center' }} variant="h5">
          No builds
        </Typography>
      ) : (
        renderBuilds(sortedBuilds)
      )}
    </Stack>
  )
}

export default BuildCards
