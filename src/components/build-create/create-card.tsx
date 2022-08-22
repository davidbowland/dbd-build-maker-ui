import React, { useState } from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardActions from '@mui/material/CardActions'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormLabel from '@mui/material/FormLabel'
import InputLabel from '@mui/material/InputLabel'
import NativeSelect from '@mui/material/NativeSelect'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { navigate } from 'gatsby'

import { Build, BuildOptions, BuildSubmission, BuildTokenResponse } from '@types'
import { NativeSelectInputProps } from '@mui/material/NativeSelect/NativeSelectInput'
import { createBuild } from '@services/build-maker'

export interface CreateCardProps {
  buildId: string
  buildOptions: BuildOptions
  buildTokenResponse: BuildTokenResponse
  channelId: string
}

export type BuildType = 'survivor' | 'killer'

const CreateCard = ({ buildId, buildOptions, buildTokenResponse, channelId }: CreateCardProps): JSX.Element => {
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
  const [buildType, setBuildType] = useState<BuildType>('killer')
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | undefined>(undefined)

  const characters = buildType === 'killer' ? Object.keys(buildOptions.Killers) : buildOptions.Survivors
  const addons = buildType === 'killer' ? buildOptions.Killers[build.character] : buildOptions.SurvivorItems[build.item]
  const addons1 = addons.filter((value) => value === 'Any' || value === 'None' || value !== build.addon2)
  const addons2 = addons.filter((value) => value === 'Any' || value === 'None' || value !== build.addon1)
  const offerings = buildType === 'killer' ? buildOptions.KillerOfferings : buildOptions.SurvivorOfferings
  const perks = buildType === 'killer' ? buildOptions.KillerPerks : buildOptions.SurvivorPerks
  const perks1 = perks.filter(
    (value) =>
      value === 'Any' || value === 'None' || (value !== build.perk2 && value !== build.perk3 && value !== build.perk4)
  )
  const perks2 = perks.filter(
    (value) =>
      value === 'Any' || value === 'None' || (value !== build.perk1 && value !== build.perk3 && value !== build.perk4)
  )
  const perks3 = perks.filter(
    (value) =>
      value === 'Any' || value === 'None' || (value !== build.perk1 && value !== build.perk2 && value !== build.perk4)
  )
  const perks4 = perks.filter(
    (value) =>
      value === 'Any' || value === 'None' || (value !== build.perk1 && value !== build.perk2 && value !== build.perk3)
  )

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
        <InputLabel id={`${name}-label`}>{title}</InputLabel>
        <NativeSelect
          aria-labelledby={`${name}-label`}
          disabled={isSubmitting}
          id={name}
          inputProps={{ 'data-testid': name } as Partial<NativeSelectInputProps>}
          onChange={(event) => setBuild({ ...build, [name]: event.target.value })}
          value={value}
        >
          {options.map((value, index) => (
            <option key={index} value={value}>
              {value}
            </option>
          ))}
        </NativeSelect>
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
      const updatedBuild = (buildType === 'killer' ? { ...build, item: undefined } : build) as Build
      await createBuild(channelId, buildId, updatedBuild)
      setSuccessMessage('Build submitted successfully!')
      navigate(`/c/${encodeURIComponent(channelId)}`)
    } catch (error) {
      console.error('submitClick', error)
      setErrorMessage('Error processing submission, please try again')
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Card sx={{ maxWidth: 600 }} variant="outlined">
        <CardContent>
          <Stack spacing={4}>
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
                <FormControlLabel control={<Radio />} disabled={isSubmitting} label="Killer" value="killer" />
                <FormControlLabel control={<Radio />} disabled={isSubmitting} label="Survivor" value="survivor" />
              </RadioGroup>
            </FormControl>
            <Divider />
            {renderOptionList('Character', 'character', build.character, characters)}
            <Divider />
            {buildType === 'survivor' &&
              renderOptionList('Item', 'item', build.item, Object.keys(buildOptions.SurvivorItems))}
            {(buildType === 'killer' || build.item !== 'None') &&
              renderOptionList('Addon 1', 'addon1', build.addon1, addons1)}
            {(buildType === 'killer' || build.item !== 'None') &&
              renderOptionList('Addon 2', 'addon2', build.addon2, addons2)}
            <Divider />
            {renderOptionList('Perk 1', 'perk1', build.perk1, perks1)}
            {renderOptionList('Perk 2', 'perk2', build.perk2, perks2)}
            {renderOptionList('Perk 3', 'perk3', build.perk3, perks3)}
            {renderOptionList('Perk 4', 'perk4', build.perk4, perks4)}
            <Divider />
            {renderOptionList('Offering', 'offering', build.offering, offerings)}
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
          </Stack>
        </CardContent>
        <CardActions>
          <Button
            disabled={isSubmitting}
            fullWidth
            onClick={submitClick}
            size="small"
            startIcon={isSubmitting ? <CircularProgress color="inherit" size={14} /> : null}
          >
            {isSubmitting ? 'Processing...' : 'Submit build'}
          </Button>
        </CardActions>
      </Card>
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
