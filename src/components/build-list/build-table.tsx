import { DataGrid, GridColDef, GridRenderCellParams, GridToolbar, GridValueGetterParams } from '@mui/x-data-grid'
import React, { useState } from 'react'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import jsonpatch from 'fast-json-patch'

import { Build, BuildBatch } from '@types'
import { patchBuild } from '@services/build-maker'

export interface BuildTableProps {
  accessToken: string | null
  builds: BuildBatch[]
  channelId: string
  isChannelMod: boolean
  refreshBuilds: () => void
  setBuilds: (value: any) => void
  setErrorMessage: (value: string) => void
}

const BuildTable = ({
  accessToken,
  builds,
  channelId,
  isChannelMod,
  refreshBuilds,
  setBuilds,
  setErrorMessage,
}: BuildTableProps): JSX.Element => {
  const [buildUpdating, setBuildUpdating] = useState<{ [key: string]: boolean }>({})
  const [columns] = useState<GridColDef[]>([
    {
      disableExport: true,
      field: 'submitter',
      headerName: 'Submitter',
      width: 200,
    },
    {
      field: 'character',
      headerName: 'Character',
      width: 150,
    },
    {
      field: 'item',
      headerName: 'Item',
      width: 150,
    },
    {
      field: 'addon1',
      headerName: 'Addon 1',
      width: 150,
    },
    {
      field: 'addon2',
      headerName: 'Addon 2',
      width: 150,
    },
    {
      field: 'perk1',
      headerName: 'Perk 1',
      width: 250,
    },
    {
      field: 'perk2',
      headerName: 'Perk 2',
      width: 250,
    },
    {
      field: 'perk3',
      headerName: 'Perk 3',
      width: 250,
    },
    {
      field: 'perk4',
      headerName: 'Perk 4',
      width: 250,
    },
    {
      field: 'offering',
      headerName: 'Offering',
      width: 200,
    },
    {
      field: 'expiration',
      headerName: 'Expiration',
      valueGetter: (params: GridValueGetterParams) => new Date(params.row.expiration).toLocaleString(),
      width: 200,
    },
  ])
  const [pageSize, setPageSize] = useState(25)

  const invertBuildCompleted = async (buildId: string, build: Build): Promise<void> => {
    if (isChannelMod) {
      if (build.completed) {
        setBuildCompleted(buildId, build, undefined)
      } else {
        setBuildCompleted(buildId, build, new Date().getTime())
      }
    }
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
        setErrorMessage('Error updating build, please refresh the page as the build may have changed')
      }
    }

    setBuildUpdating((current) => {
      const { [buildId]: _, ...newBuildUpdating } = current
      return newBuildUpdating
    })
    refreshBuilds()
  }

  const columnsWithCompleted = [
    {
      field: 'completed',
      headerName: 'Completed',
      hideable: false,
      renderCell: (params: GridRenderCellParams) =>
        buildUpdating[params.row.id] ? (
          <Typography sx={{ textAlign: 'center', width: '100%' }}>
            <CircularProgress color="inherit" size={16} />
          </Typography>
        ) : (
          <Switch
            aria-label={params.row.completed ? 'Unmark complete' : 'Mark complete'}
            checked={!!params.row.completed}
            onClick={() => invertBuildCompleted(params.row.id, params.row)}
          />
        ),
    },
    ...columns,
  ]

  return (
    <Grid spacing={4} sx={{ width: '100%' }}>
      <Grid container justifyContent="center" spacing={4}>
        {builds.length === 0 ? (
          <Grid item xs>
            <Typography sx={{ textAlign: 'center' }} variant="h5">
              No builds
            </Typography>
          </Grid>
        ) : (
          <Grid item sx={{ width: '100%' }} xs>
            <DataGrid
              autoHeight={true}
              columns={columnsWithCompleted}
              components={{ Toolbar: GridToolbar }}
              initialState={{ columns: { columnVisibilityModel: { id: false } } }}
              onPageSizeChange={setPageSize}
              pageSize={pageSize}
              rows={builds.map((b) => ({ ...b.data, id: b.id }))}
              rowsPerPageOptions={[5, 10, 25, 50, 100]}
            />
          </Grid>
        )}
      </Grid>
    </Grid>
  )
}

export default BuildTable
