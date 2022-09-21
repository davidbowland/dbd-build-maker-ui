import React, { useState } from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormLabel from '@mui/material/FormLabel'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import NativeSelect from '@mui/material/NativeSelect'
import Paper from '@mui/material/Paper'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import ShuffleIcon from '@mui/icons-material/Shuffle'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { navigate } from 'gatsby'

import { Build, BuildOptions, BuildSubmission, BuildTokenResponse, Channel } from '@types'
import { NativeSelectInputProps } from '@mui/material/NativeSelect/NativeSelectInput'
import { createBuild } from '@services/build-maker'

export interface CreateCardProps {
  buildId: string
  buildOptions: BuildOptions
  buildTokenResponse: BuildTokenResponse
  channel: Channel
  channelId: string
}

export type BuildType = 'survivor' | 'killer'

const applyFilter = (arr: any[], toFilter: any[]): any[] =>
  arr.filter((value) => value === 'Any' || value === 'None' || toFilter.indexOf(value) === -1)

const CreateCard = ({
  buildId,
  buildOptions,
  buildTokenResponse,
  channel,
  channelId,
}: CreateCardProps): JSX.Element => {
  const [build, setBuild] = useState<BuildSubmission>({
    addon1: 'Any',
    addon2: 'Any',
    character: 'Any',
    item: 'Any',
    notes: '',
    offering: 'Any',
    perk1: 'Any',
    perk2: 'Any',
    perk3: 'Any',
    perk4: 'Any',
    submitter: buildTokenResponse.submitter,
  })
  const [buildType, setBuildType] = useState<BuildType>(
    channel.disabledOptions.indexOf('Killers') === -1 ? 'killer' : 'survivor'
  )
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | undefined>(undefined)

  const characters = applyFilter(
    buildType === 'killer' ? Object.keys(buildOptions.Killers) : buildOptions.Survivors,
    channel.disabledOptions
  )
  const addons = applyFilter(
    buildType === 'killer' ? buildOptions.Killers[build.character] : buildOptions['Survivor Items'][build.item],
    channel.disabledOptions
  )
  const addons1 = applyFilter(addons, [build.addon2])
  const addons2 = applyFilter(addons, [build.addon1])
  const items = applyFilter(Object.keys(buildOptions['Survivor Items']), channel.disabledOptions)
  const offerings = applyFilter(
    buildType === 'killer' ? buildOptions['Killer Offerings'] : buildOptions['Survivor Offerings'],
    channel.disabledOptions
  )
  const perks = applyFilter(
    buildType === 'killer' ? buildOptions['Killer Perks'] : buildOptions['Survivor Perks'],
    channel.disabledOptions
  )
  const perks1 = applyFilter(perks, [build.perk2, build.perk3, build.perk4])
  const perks2 = applyFilter(perks, [build.perk1, build.perk3, build.perk4])
  const perks3 = applyFilter(perks, [build.perk1, build.perk2, build.perk4])
  const perks4 = applyFilter(perks, [build.perk1, build.perk2, build.perk3])

  const buildTypeChange = (value: BuildType): void => {
    setBuildType(value)
    setBuild({
      ...build,
      addon1: 'Any',
      addon2: 'Any',
      character: 'Any',
      item: 'Any',
      offering: 'Any',
      perk1: 'Any',
      perk2: 'Any',
      perk3: 'Any',
      perk4: 'Any',
    })
  }

  const renderOptionList = (title: string, name: string, value: string, options: string[]): JSX.Element => {
    return (
      <FormControl fullWidth>
        <Stack direction="row">
          <InputLabel id={`${name}-label`}>{title}</InputLabel>
          <NativeSelect
            aria-labelledby={`${name}-label`}
            disabled={isSubmitting}
            id={name}
            inputProps={{ 'data-testid': name } as Partial<NativeSelectInputProps>}
            onChange={(event) => setBuild({ ...build, [name]: event.target.value })}
            sx={{ maxWidth: '95%' }}
            value={value}
          >
            {options.map((value, index) => (
              <option key={index} value={value}>
                {value}
              </option>
            ))}
          </NativeSelect>
          <IconButton
            aria-label={`Shuffle ${name}`}
            disabled={isSubmitting}
            onClick={() => setBuild({ ...build, [name]: options[Math.floor(Math.random() * options.length)] })}
            sx={{ margin: 'auto 0 0 0' }}
          >
            <ShuffleIcon />
          </IconButton>
        </Stack>
      </FormControl>
    )
  }

  const snackbarErrorClose = (): void => {
    setErrorMessage(undefined)
  }

  const snackbarSuccessClose = (): void => {
    setSuccessMessage(undefined)
  }

  const submitClick = async (): Promise<void> => {
    setIsSubmitting(true)
    try {
      const removeKillerItem = (buildType === 'killer' ? { ...build, item: undefined } : build) as Build
      const removeItemAddons = (
        removeKillerItem.item === 'None' ? { ...removeKillerItem, addon1: 'None', addon2: 'None' } : removeKillerItem
      ) as Build
      await createBuild(channelId, buildId, removeItemAddons)
      setSuccessMessage('Build submitted successfully!')
      navigate(`/c/${encodeURIComponent(channelId)}`)
    } catch (error) {
      console.error('submitClick', error)
      setErrorMessage('Error processing submission, please reload the page and try again')
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Paper elevation={4}>
        <Stack padding={4} spacing={4}>
          <Typography sx={{ textAlign: 'center' }} variant="h4">
            Build Options
          </Typography>
          <label>
            <TextField
              aria-readonly="true"
              disabled={true}
              fullWidth
              label="Name of Requestor"
              name="requestor-name"
              type="text"
              value={build.submitter}
              variant="filled"
            />
          </label>
          <Divider />
          <FormControl>
            <FormLabel id="build-type-label">Build Type</FormLabel>
            <RadioGroup
              aria-labelledby="build-type-label"
              name="radio-buttons-group"
              onChange={(event) => buildTypeChange(event.target.value as BuildType)}
              value={buildType}
            >
              {channel.disabledOptions.indexOf('Killers') === -1 && (
                <FormControlLabel control={<Radio />} disabled={isSubmitting} label="Killer" value="killer" />
              )}
              {channel.disabledOptions.indexOf('Survivors') === -1 && (
                <FormControlLabel control={<Radio />} disabled={isSubmitting} label="Survivor" value="survivor" />
              )}
            </RadioGroup>
          </FormControl>
          <Divider />
          {renderOptionList('Character', 'character', build.character, characters)}
          {(buildType === 'killer' || channel.disabledOptions.indexOf('Survivor Items') === -1) && (
            <>
              <Divider />
              {buildType === 'survivor' && renderOptionList('Item', 'item', build.item, items)}
              {(buildType === 'killer' || build.item !== 'None') &&
                renderOptionList('Addon 1', 'addon1', build.addon1, addons1)}
              {(buildType === 'killer' || build.item !== 'None') &&
                renderOptionList('Addon 2', 'addon2', build.addon2, addons2)}
            </>
          )}
          {((buildType === 'killer' && channel.disabledOptions.indexOf('Killer Perks') === -1) ||
            (buildType === 'survivor' && channel.disabledOptions.indexOf('Survivor Perks') === -1)) && (
            <>
              <Divider />
              {renderOptionList('Perk 1', 'perk1', build.perk1, perks1)}
              {renderOptionList('Perk 2', 'perk2', build.perk2, perks2)}
              {renderOptionList('Perk 3', 'perk3', build.perk3, perks3)}
              {renderOptionList('Perk 4', 'perk4', build.perk4, perks4)}
            </>
          )}
          {((buildType === 'killer' && channel.disabledOptions.indexOf('Killer Offerings') === -1) ||
            (buildType === 'survivor' && channel.disabledOptions.indexOf('Survivor Offerings') === -1)) && (
            <>
              <Divider />
              {renderOptionList('Offering', 'offering', build.offering, offerings)}
            </>
          )}
          {channel.disabledOptions.indexOf('Notes') === -1 && (
            <>
              <Divider />
              <label>
                <TextField
                  disabled={isSubmitting}
                  fullWidth
                  label="Notes"
                  multiline
                  name="notes"
                  onChange={(event) => setBuild({ ...build, notes: event.target.value.slice(0, 250) })}
                  type="text"
                  value={build.notes}
                  variant="filled"
                />
              </label>
            </>
          )}
          <Grid container justifyContent="center" sx={{ width: '100%' }}>
            <Grid item sm={6} xs={12}>
              <Button
                disabled={isSubmitting}
                fullWidth
                onClick={submitClick}
                size="small"
                startIcon={isSubmitting ? <CircularProgress color="inherit" size={14} /> : null}
                variant="contained"
              >
                {isSubmitting ? 'Processing...' : 'Submit build'}
              </Button>
            </Grid>
          </Grid>
        </Stack>
      </Paper>
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

export default CreateCard
