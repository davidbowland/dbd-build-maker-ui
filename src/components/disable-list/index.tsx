import React, { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import CircularProgress from '@mui/material/CircularProgress'
import Collapse from '@mui/material/Collapse'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import FactCheckIcon from '@mui/icons-material/FactCheck'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import ListSubheader from '@mui/material/ListSubheader'
import Skeleton from '@mui/material/Skeleton'
import Snackbar from '@mui/material/Snackbar'
import jsonpatch from 'fast-json-patch'

import { BuildOptions, Channel } from '@types'
import { fetchBuildOptions, fetchChannel, patchChannel } from '@services/build-maker'

export interface DisableListProps {
  accessToken: string
  channelId: string
}

const DisableList = ({ accessToken, channelId }: DisableListProps): JSX.Element => {
  const [buildOptions, setBuildOptions] = useState<BuildOptions | undefined>(undefined)
  const [channel, setChannel] = useState<Channel | undefined>(undefined)
  const [collapsedOptions, setCollapsedOptions] = useState<{ [key: string]: boolean }>({})
  const [dialogOpen, setDialogOpen] = useState<boolean>(false)
  const [disabledOptions, setDisabledOptions] = useState<string[]>([])
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)

  const dialogClose = (): void => {
    if (!isLoading) {
      setDialogOpen(false)
    }
  }

  const handleCollapse = (label: string): void => {
    setCollapsedOptions({ ...collapsedOptions, [label]: !collapsedOptions[label] })
  }

  const renderLoading = (count: number): JSX.Element[] =>
    Array.from({ length: count }).map((_, index) => (
      <ListItem key={index}>
        <Skeleton height={100} variant="text" width="100%" />
      </ListItem>
    ))

  const renderNotesOption = (): JSX.Element => {
    const label = 'Notes'
    return (
      <ListItem disablePadding>
        <ListItemButton dense onClick={() => updateCheckbox(label)} sx={{ pl: 2 }}>
          <ListItemIcon sx={{ minWidth: 35 }}>
            <Checkbox
              checked={disabledOptions.indexOf(label) === -1}
              disableRipple
              edge="start"
              inputProps={{ 'aria-labelledby': 'label-notes' }}
              tabIndex={-1}
            />
          </ListItemIcon>
          <ListItemText id={'label-notes'} primary={label} />
        </ListItemButton>
      </ListItem>
    )
  }

  const renderOptions = (options: any, padding = 2, disabled = false): JSX.Element[] =>
    Object.keys(options).map((key, index) => {
      const value: any = options[key]
      const label = typeof value === 'string' ? value : key
      if (label === 'Any' || label === 'None') {
        return <></>
      }
      const hasSubItem = typeof value !== 'string' && typeof value !== 'undefined'
      return (
        <>
          <ListItem
            disablePadding
            secondaryAction={
              hasSubItem ? (
                <>
                  {collapsedOptions[label] ? (
                    <IconButton aria-label={`Collapse ${label}`} onClick={() => handleCollapse(label)}>
                      <ExpandLess />
                    </IconButton>
                  ) : (
                    <IconButton aria-label={`Expand ${label}`} onClick={() => handleCollapse(label)}>
                      <ExpandMore />
                    </IconButton>
                  )}
                </>
              ) : null
            }
          >
            <ListItemButton
              dense
              disabled={disabled}
              key={index}
              onClick={() => updateCheckbox(label)}
              sx={{ pl: padding }}
            >
              <ListItemIcon sx={{ minWidth: 35 }}>
                <Checkbox
                  checked={disabled || disabledOptions.indexOf(label) === -1}
                  disableRipple
                  edge="start"
                  inputProps={{ 'aria-labelledby': `label-${padding}-${index}` }}
                  tabIndex={-1}
                />
              </ListItemIcon>
              <ListItemText id={`label-${padding}-${index}`} primary={label} />
            </ListItemButton>
          </ListItem>
          {hasSubItem && (
            <Collapse in={!!collapsedOptions[label]} timeout="auto" unmountOnExit>
              <List component="div" disablePadding sx={{ bgcolor: 'background.paper', width: '100%' }}>
                {renderOptions(value, padding + 3, disabled || disabledOptions.indexOf(label) !== -1)}
              </List>
            </Collapse>
          )}
        </>
      )
    })

  const saveBuildOptions = async (channel: Channel): Promise<void> => {
    if (disabledOptions.indexOf('Killers') !== -1 && disabledOptions.indexOf('Survivors') !== -1) {
      setErrorMessage('Either Killers or Survivors must be enabled')
      return
    }

    setIsLoading(true)
    try {
      const newChannel = { ...channel, disabledOptions }
      const jsonPatchOperations = jsonpatch.compare(channel, newChannel, true)
      await patchChannel(channelId, jsonPatchOperations, accessToken)
      setChannel(newChannel)
      setDialogOpen(false)
    } catch (error) {
      console.error('saveBuildOptions', error)
      setErrorMessage('Error saving build options, please refresh the page and try again')
    }
    setIsLoading(false)
  }

  const snackbarErrorClose = (): void => {
    setErrorMessage(undefined)
  }

  const updateCheckbox = (value: string): void => {
    if (disabledOptions.indexOf(value) < 0) {
      setDisabledOptions([...disabledOptions, value])
    } else {
      setDisabledOptions(disabledOptions.filter((option) => option !== value))
    }
  }

  useEffect(() => {
    if (channel !== undefined) {
      setDisabledOptions(channel.disabledOptions)
    }
  }, [channel])

  useEffect(() => {
    if (dialogOpen === true) {
      fetchBuildOptions()
        .then(setBuildOptions)
        .catch((error) => {
          console.error('fetchBuildOptions', error)
          setErrorMessage('Error fetching build options, please try again')
          setDialogOpen(false)
        })
      fetchChannel(channelId)
        .then(setChannel)
        .catch((error) => {
          console.error('fetchChannel', error)
          setErrorMessage('Error fetching channel details, please try again')
          setDialogOpen(false)
        })
    } else {
      setBuildOptions(undefined)
      setChannel(undefined)
    }
  }, [dialogOpen])

  return (
    <>
      <Dialog onClose={dialogClose} open={dialogOpen}>
        <DialogTitle>Edit build options</DialogTitle>
        <DialogContent>
          <List
            subheader={<ListSubheader>Enabled build options</ListSubheader>}
            sx={{ bgcolor: 'background.paper', maxWidth: '100%', width: '450px' }}
          >
            {buildOptions === undefined || channel === undefined || disabledOptions === undefined ? (
              renderLoading(6)
            ) : (
              <>
                {renderOptions(buildOptions)}
                {renderNotesOption()}
              </>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button
            disabled={buildOptions === undefined || channel === undefined || isLoading}
            fullWidth
            onClick={() => channel && saveBuildOptions(channel)}
            startIcon={isLoading ? <CircularProgress color="inherit" size={14} /> : null}
          >
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
      <Button fullWidth onClick={() => setDialogOpen(true)} startIcon={<FactCheckIcon />} variant="contained">
        Edit build options
      </Button>
      <Snackbar autoHideDuration={20_000} onClose={snackbarErrorClose} open={errorMessage !== undefined}>
        <Alert onClose={snackbarErrorClose} severity="error" variant="filled">
          {errorMessage}
        </Alert>
      </Snackbar>
    </>
  )
}

export default DisableList
