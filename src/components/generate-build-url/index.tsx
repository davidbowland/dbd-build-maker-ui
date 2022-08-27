import React, { useState } from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import Divider from '@mui/material/Divider'
import LinkIcon from '@mui/icons-material/Link'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { createBuildToken } from '@services/build-maker'

export interface GenerateBuildUrlProps {
  accessToken: string
  channelId: string
}

const GenerateBuildUrl = ({ accessToken, channelId }: GenerateBuildUrlProps): JSX.Element => {
  const [buildUrl, setBuildUrl] = useState<string | undefined>(undefined)
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)
  const [expiration, setExpiration] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [submitter, setSubmitter] = useState('')
  const [submitterError, setSubmitterError] = useState<string | undefined>(undefined)
  const [successMessage, setSuccessMessage] = useState<string | undefined>(undefined)

  const copyBuildUrl = (buildUrl: string): void => {
    try {
      navigator.clipboard.writeText(buildUrl)
      setSuccessMessage('Link copied to clipboard')
    } catch (error) {
      console.error('copyShortenedUrl', error)
      setErrorMessage('Could not copy link to clipboard')
    }
  }

  const generateBuildUrl = async (): Promise<void> => {
    if (submitter === '') {
      setSubmitterError('Requestor name is required')
      return
    }

    setIsLoading(true)
    try {
      const buildToken = await createBuildToken(channelId, accessToken, submitter)
      setBuildUrl(
        `${window.location.origin}/c/${encodeURIComponent(channelId)}/b/${encodeURIComponent(buildToken.value)}`
      )
      setExpiration(new Date(buildToken.expiration).toLocaleString())
      setSubmitter('')
      setSubmitterError(undefined)
    } catch (error) {
      console.error('generateBuildUrl', error)
      setErrorMessage('Error generating build URL')
    }
    setIsLoading(false)
  }

  const renderCopyUrl = (buildUrl: string): JSX.Element => {
    return (
      <Stack spacing={2}>
        <label>
          <TextField
            aria-readonly="true"
            fullWidth
            label="Build URL"
            name="build-url"
            type="text"
            value={buildUrl}
            variant="filled"
          />
        </label>
        {expiration && (
          <Typography sx={{ textAlign: 'center' }} variant="h6">
            Link expires {expiration}
          </Typography>
        )}
        <Button
          color="secondary"
          fullWidth
          onClick={() => copyBuildUrl(buildUrl)}
          startIcon={<ContentCopyIcon />}
          variant="outlined"
        >
          Copy build URL
        </Button>
        <Divider />
      </Stack>
    )
  }

  const renderGenerateToken = (): JSX.Element => {
    return (
      <Stack spacing={2}>
        <label>
          <TextField
            disabled={isLoading}
            error={submitterError !== undefined}
            fullWidth
            helperText={submitterError}
            label="Name of Requestor"
            name="requestor-name"
            onChange={(event) => setSubmitter(event.target.value)}
            type="text"
            value={submitter}
            variant="filled"
          />
        </label>
        <Button
          disabled={isLoading}
          fullWidth
          onClick={generateBuildUrl}
          startIcon={isLoading ? <CircularProgress color="inherit" size={14} /> : <LinkIcon />}
          variant="contained"
        >
          {isLoading ? 'Generating new build URL...' : 'Generate new build URL'}
        </Button>
      </Stack>
    )
  }

  const snackbarErrorClose = (): void => {
    setErrorMessage(undefined)
  }

  const snackbarSuccessClose = (): void => {
    setSuccessMessage(undefined)
  }

  return (
    <>
      <Stack spacing={2}>
        {buildUrl !== undefined && renderCopyUrl(buildUrl)}
        {renderGenerateToken()}
      </Stack>
      <Snackbar autoHideDuration={20_000} onClose={snackbarErrorClose} open={errorMessage !== undefined}>
        <Alert onClose={snackbarErrorClose} severity="error" variant="filled">
          {errorMessage}
        </Alert>
      </Snackbar>
      <Snackbar autoHideDuration={5_000} onClose={snackbarSuccessClose} open={successMessage !== undefined}>
        <Alert onClose={snackbarSuccessClose} severity="success" variant="filled">
          {successMessage}
        </Alert>
      </Snackbar>
    </>
  )
}

export default GenerateBuildUrl
