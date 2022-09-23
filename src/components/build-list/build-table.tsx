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
  sortCompareFn?: (a: string, b: string) => number
}

const BuildTable = ({
  accessToken,
  builds,
  channelId,
  isChannelMod,
  refreshBuilds,
  setBuilds,
  setErrorMessage,
  sortCompareFn,
}: BuildTableProps): JSX.Element => {
  const [buildUpdating, setBuildUpdating] = useState<{ [key: string]: boolean }>({})
  const [columns] = useState<GridColDef[]>([
    {
      field: 'submitter',
      flex: 1,
      headerName: 'Submitter',
      minWidth: 200,
    },
    {
      field: 'character',
      flex: 1,
      headerName: 'Character',
      minWidth: 200,
    },
    {
      field: 'item',
      flex: 1,
      headerName: 'Item',
      minWidth: 100,
    },
    {
      field: 'addon1',
      flex: 1,
      headerName: 'Addon 1',
      minWidth: 250,
    },
    {
      field: 'addon2',
      flex: 1,
      headerName: 'Addon 2',
      minWidth: 250,
    },
    {
      field: 'perk1',
      flex: 1,
      headerName: 'Perk 1',
      minWidth: 250,
    },
    {
      field: 'perk2',
      flex: 1,
      headerName: 'Perk 2',
      minWidth: 250,
    },
    {
      field: 'perk3',
      flex: 1,
      headerName: 'Perk 3',
      minWidth: 250,
    },
    {
      field: 'perk4',
      flex: 1,
      headerName: 'Perk 4',
      minWidth: 250,
    },
    {
      field: 'offering',
      flex: 1,
      headerName: 'Offering',
      minWidth: 200,
    },
    {
      field: 'expiration',
      headerName: 'Expiration',
      minWidth: 200,
      valueGetter: (params: GridValueGetterParams) => new Date(params.row.expiration).toLocaleString(),
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
      flex: 1,
      headerName: 'Completed',
      hideable: false,
      minWidth: 100,
      renderCell: (params: GridRenderCellParams) =>
        buildUpdating[params.row.id] ? (
          <Typography sx={{ textAlign: 'center', width: '100%' }}>
            <CircularProgress color="inherit" size={16} />
          </Typography>
        ) : (
          <Switch
            aria-label={params.row.completed ? 'Unmark complete' : 'Mark complete'}
            checked={!!params.row.completed}
            disabled={!isChannelMod}
            onClick={() => invertBuildCompleted(params.row.id, params.row)}
          />
        ),
      valueGetter: (params: GridValueGetterParams) =>
        params.row.completed && new Date(params.row.completed).toLocaleString(),
    },
    ...columns,
  ]

  return (
    <Grid spacing={4} sx={{ width: '100%' }}>
      <Grid container justifyContent="center" spacing={4}>
        {builds.length === 0 ? (
          <Grid item xs>
            <Typography sx={{ minHeight: '50vh', textAlign: 'center' }} variant="h5">
              No builds
            </Typography>
          </Grid>
        ) : (
          <Grid item sx={{ width: '100%' }} xs>
            <DataGrid
              autoHeight={true}
              columns={columnsWithCompleted}
              components={{ Toolbar: GridToolbar }}
              disableSelectionOnClick={true}
              initialState={{ columns: { columnVisibilityModel: { id: false } } }}
              onPageSizeChange={setPageSize}
              pageSize={pageSize}
              rows={builds.map((b) => {
                const [addon1, addon2] = [b.data.addon1, b.data.addon2].sort(sortCompareFn)
                const [perk1, perk2, perk3, perk4] = [b.data.perk1, b.data.perk2, b.data.perk3, b.data.perk4].sort(
                  sortCompareFn
                )
                return { ...b.data, addon1, addon2, id: b.id, perk1, perk2, perk3, perk4 }
              })}
              rowsPerPageOptions={[5, 10, 25, 50, 100]}
            />
          </Grid>
        )}
      </Grid>
    </Grid>
  )
}

export default BuildTable
