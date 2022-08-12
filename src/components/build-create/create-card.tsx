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

const CreateCard = ({
  buildId,
  buildOptions,
  buildTokenResponse,
  channelId
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
            <FormControl fullWidth>
              <InputLabel id="character-label">Character</InputLabel>
              <NativeSelect
                aria-labelledby="character-label"
                disabled={isSubmitting}
                id="character"
                inputProps={{ 'data-testid': 'character' } as Partial<NativeSelectInputProps>}
                onChange={(event) => setBuild({ ...build, character: event.target.value })}
                value={build.character}
              >
                {characters.map((name, index) => (
                  <option key={index} value={name}>
                    {name}
                  </option>
                ))}
              </NativeSelect>
            </FormControl>
            <Divider />
            {buildType === 'survivor' && (
              <FormControl fullWidth>
                <InputLabel id="item-label">Item</InputLabel>
                <NativeSelect
                  aria-labelledby="item-label"
                  disabled={isSubmitting}
                  id="item"
                  inputProps={{ 'data-testid': 'item' } as Partial<NativeSelectInputProps>}
                  onChange={(event) => setBuild({ ...build, item: event.target.value })}
                  value={build.item}
                >
                  {Object.keys(buildOptions.SurvivorItems).map((name, index) => (
                    <option key={index} value={name}>
                      {name}
                    </option>
                  ))}
                </NativeSelect>
              </FormControl>
            )}
            {(buildType === 'killer' || build.item !== 'None') && (
              <FormControl fullWidth>
                <InputLabel id="addon1-label">Addon 1</InputLabel>
                <NativeSelect
                  aria-labelledby="addon1-label"
                  disabled={isSubmitting}
                  id="addon1"
                  inputProps={{ 'data-testid': 'addon1' } as Partial<NativeSelectInputProps>}
                  onChange={(event) => setBuild({ ...build, addon1: event.target.value })}
                  value={build.addon1}
                >
                  {addons1.map((name, index) => (
                    <option key={index} value={name}>
                      {name}
                    </option>
                  ))}
                </NativeSelect>
              </FormControl>
            )}
            {(buildType === 'killer' || build.item !== 'None') && (
              <FormControl fullWidth>
                <InputLabel id="addon2-label">Addon 2</InputLabel>
                <NativeSelect
                  aria-labelledby="addon2-label"
                  disabled={isSubmitting}
                  id="addon2"
                  inputProps={{ 'data-testid': 'addon2' } as Partial<NativeSelectInputProps>}
                  onChange={(event) => setBuild({ ...build, addon2: event.target.value })}
                  value={build.addon2}
                >
                  {addons2.map((name, index) => (
                    <option key={index} value={name}>
                      {name}
                    </option>
                  ))}
                </NativeSelect>
              </FormControl>
            )}
            <Divider />
            <FormControl fullWidth>
              <InputLabel id="perk1-label">Perk 1</InputLabel>
              <NativeSelect
                aria-labelledby="perk1-label"
                disabled={isSubmitting}
                id="perk1"
                inputProps={{ 'data-testid': 'perk1' } as Partial<NativeSelectInputProps>}
                onChange={(event) => setBuild({ ...build, perk1: event.target.value })}
                value={build.perk1}
              >
                {perks1.map((name, index) => (
                  <option key={index} value={name}>
                    {name}
                  </option>
                ))}
              </NativeSelect>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="perk2-label">Perk 2</InputLabel>
              <NativeSelect
                aria-labelledby="perk2-label"
                disabled={isSubmitting}
                id="perk2"
                inputProps={{ 'data-testid': 'perk2' } as Partial<NativeSelectInputProps>}
                onChange={(event) => setBuild({ ...build, perk2: event.target.value })}
                value={build.perk2}
              >
                {perks2.map((name, index) => (
                  <option key={index} value={name}>
                    {name}
                  </option>
                ))}
              </NativeSelect>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="perk3-label">Perk 3</InputLabel>
              <NativeSelect
                aria-labelledby="perk3-label"
                disabled={isSubmitting}
                id="perk3"
                inputProps={{ 'data-testid': 'perk3' } as Partial<NativeSelectInputProps>}
                onChange={(event) => setBuild({ ...build, perk3: event.target.value })}
                value={build.perk3}
              >
                {perks3.map((name, index) => (
                  <option key={index} value={name}>
                    {name}
                  </option>
                ))}
              </NativeSelect>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="perk4-label">Perk 4</InputLabel>
              <NativeSelect
                aria-labelledby="perk4-label"
                disabled={isSubmitting}
                id="perk4"
                inputProps={{ 'data-testid': 'perk4' } as Partial<NativeSelectInputProps>}
                onChange={(event) => setBuild({ ...build, perk4: event.target.value })}
                value={build.perk4}
              >
                {perks4.map((name, index) => (
                  <option key={index} value={name}>
                    {name}
                  </option>
                ))}
              </NativeSelect>
            </FormControl>
            <Divider />
            <FormControl fullWidth>
              <InputLabel id="offering-label">Offering</InputLabel>
              <NativeSelect
                aria-labelledby="offering-label"
                disabled={isSubmitting}
                id="offering"
                inputProps={{ 'data-testid': 'offering' } as Partial<NativeSelectInputProps>}
                onChange={(event) => setBuild({ ...build, offering: event.target.value })}
                value={build.offering}
              >
                {offerings.map((name, index) => (
                  <option key={index} value={name}>
                    {name}
                  </option>
                ))}
              </NativeSelect>
            </FormControl>
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
