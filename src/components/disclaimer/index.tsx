import React, { useState } from 'react'
import Button from '@mui/material/Button'
import Cookies from 'universal-cookie'
import Drawer from '@mui/material/Drawer'
import Grid from '@mui/material/Grid'
import { Link } from 'gatsby'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

const Disclaimer = (): JSX.Element => {
  const cookies = new Cookies()

  const [open, setOpen] = useState(cookies.get('disclaimer_accept') !== 'true')

  const closeDrawer = (): void => {
    cookies.set('disclaimer_accept', 'true', { path: '/', sameSite: 'strict', secure: true })
    setOpen(false)
  }

  return (
    <Drawer anchor="bottom" sx={{ display: open ? 'block' : 'none' }} variant="permanent">
      <Stack spacing={1} sx={{ p: 2 }}>
        <Typography variant="h6">Cookie and Privacy Disclosure</Typography>
        <Grid container justifyContent="center" sx={{ width: '100%' }}>
          <Grid item md sm={12}>
            <Stack spacing={1}>
              <Typography variant="body2">
                This site only uses essential cookies such as those used to keep you logged in. We collect no personally
                identifiable information and no contact information. Depending on your activity, your IP address may
                appear in our logs for up to 45 days. We never sell your information -- we intentionally don&apos;t have
                information to sell -- but we do collect demographic and site usage information using{' '}
                <Link to="https://aws.amazon.com/pinpoint/">Amazon Pinpoint</Link>.
              </Typography>
              <Typography variant="body2">
                The only information we store longer than 45 days is your channel information. To remove this
                information from our database, you may delete your channel at any time. Deleting your channel is
                immediate, but builds will be retained until they expire.
              </Typography>
            </Stack>
          </Grid>
          <Grid item lg={2} md={3} sm={6} sx={{ p: 1, textAlign: 'center' }} xs={12}>
            <Button fullWidth onClick={closeDrawer} variant="contained">
              Accept &amp; continue
            </Button>
          </Grid>
        </Grid>
      </Stack>
    </Drawer>
  )
}

export default Disclaimer
