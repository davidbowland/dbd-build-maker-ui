import React, { useState } from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import CreateIcon from '@mui/icons-material/Create'
import Snackbar from '@mui/material/Snackbar'

import { createChannel } from '@services/build-maker'

export interface CreateButtonProps {
  accessToken: string
}

export const CreateButton = ({ accessToken }: CreateButtonProps): JSX.Element => {
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)
  const [showCreatePending, setShowCreatePending] = useState(false)

  const createChannelClick = async (): Promise<void> => {
    try {
      setShowCreatePending(true)
      await createChannel(accessToken!)
      window.location.reload()
    } catch (error) {
      console.error('createChannelClick', error)
      setErrorMessage('Error creating channel')
      setShowCreatePending(false)
    }
  }

  const snackbarErrorClose = (): void => {
    setErrorMessage(undefined)
  }

  return (
    <>
      <Button
        data-amplify-analytics-name="create-channel-click"
        data-amplify-analytics-on="click"
        disabled={showCreatePending}
        fullWidth
        onClick={createChannelClick}
        startIcon={showCreatePending ? <CircularProgress color="inherit" size={14} /> : <CreateIcon />}
        variant="contained"
      >
        {showCreatePending ? 'Creating channel...' : 'Create your channel'}
      </Button>
      <Snackbar autoHideDuration={20_000} onClose={snackbarErrorClose} open={errorMessage !== undefined}>
        <Alert onClose={snackbarErrorClose} severity="error" variant="filled">
          {errorMessage}
        </Alert>
      </Snackbar>
    </>
  )
}

export default CreateButton
