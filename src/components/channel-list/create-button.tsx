import React, { useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Grid from '@mui/material/Grid'
import { navigate } from 'gatsby'
import Snackbar from '@mui/material/Snackbar'

import { createChannel } from '@services/build-maker'

export interface CreateButtonProps {
  accessToken: string
}

export const CreateButton = ({ accessToken }: CreateButtonProps): JSX.Element => {
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showCreatePending, setShowCreatePending] = useState(false)

  const createChannelClick = async (): Promise<void> => {
    try {
      setShowCreateDialog(false)
      setShowCreatePending(true)
      const channel = await createChannel(accessToken)
      navigate(`/c/${channel.channelId}`)
    } catch (error) {
      console.error('createChannelClick', error)
      setErrorMessage('Error creating channel')
      setShowCreatePending(false)
    }
  }

  const createDialogClose = (): void => {
    setShowCreateDialog(false)
  }

  const snackbarErrorClose = (): void => {
    setErrorMessage(undefined)
  }

  return (
    <>
      <Grid container justifyContent="center" sx={{ width: '100%' }}>
        <Grid item sm={6} xs={12}>
          <Button
            data-amplify-analytics-name="create-channel-click"
            data-amplify-analytics-on="click"
            disabled={showCreatePending}
            fullWidth
            onClick={() => setShowCreateDialog(true)}
            startIcon={showCreatePending ? <CircularProgress color="inherit" size={14} /> : <AddIcon />}
            variant="contained"
          >
            {showCreatePending ? 'Registering channel...' : 'Register your channel'}
          </Button>
        </Grid>
      </Grid>
      <Dialog
        aria-describedby="Prompt to confirm channel registration"
        aria-labelledby="Register channel dialog"
        onClose={createDialogClose}
        open={showCreateDialog}
      >
        <DialogTitle id="alert-dialog-title">Register channel</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            This will register your channel to be displayed on the channel list and receive build submissions.
            Registering your channel is not necessary if you simply want to view builds or moderate an existing channel.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={createDialogClose}>
            Cancel
          </Button>
          <Button onClick={createChannelClick}>Continue</Button>
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

export default CreateButton
