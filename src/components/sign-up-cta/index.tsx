import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardActions from '@mui/material/CardActions'
import CardContent from '@mui/material/CardContent'
import CardMedia from '@mui/material/CardMedia'
import Grid from '@mui/material/Grid'
import LoginIcon from '@mui/icons-material/Login'
import React from 'react'
import Stack from '@mui/material/Stack'
import { StaticImage } from 'gatsby-plugin-image'
import Typography from '@mui/material/Typography'

import { initiateTwitchLogin } from '@services/auth'

const SignUpCta = (): JSX.Element => {
  return (
    <>
      <Stack margin="auto" maxWidth="600px" spacing={2}>
        <Typography sx={{ textAlign: 'center' }} variant="h6">
          Sign in with Twitch to get started collecting builds for your channel!
        </Typography>
        <Button
          data-amplify-analytics-name="cta-click"
          data-amplify-analytics-on="click"
          fullWidth
          onClick={initiateTwitchLogin}
          startIcon={<LoginIcon />}
          variant="contained"
        >
          Sign in with Twitch
        </Button>
        <Typography sx={{ textAlign: 'center' }}>
          Your account is free and we collect no personally identifiable information.
        </Typography>
      </Stack>
      <Grid alignItems="center" component="div" container direction="column" spacing={0} style={{ minHeight: '100vh' }}>
        <Grid item xs={3}>
          <Stack spacing={4}>
            <Card sx={{ maxWidth: 350 }}>
              <CardMedia>
                <StaticImage alt="Twitch logo" src="../../assets/images/twitch-logo.png" />
              </CardMedia>
              <CardContent>
                <Typography component="div" gutterBottom variant="h5">
                  Use your existing Twitch account
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  There is no account to create. Once you log in on the Twitch website, you will be redirected back to
                  this site. The only non-public information retrieved is the list of moderators for your channel.
                  (Moderators have the same access to builds that owners do.)
                </Typography>
              </CardContent>
              <CardActions>
                <Button onClick={initiateTwitchLogin} size="small">
                  Sign in
                </Button>
              </CardActions>
            </Card>
            <Card sx={{ maxWidth: 350 }}>
              <CardMedia>
                <StaticImage alt="Build options editing" src="../../assets/images/build-options.png" />
              </CardMedia>
              <CardContent>
                <Typography component="div" gutterBottom variant="h5">
                  Manage which builds you offer
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  Choose which killers, survivors, perks, addons, items, and offerings you&apos;re willing to play for a
                  build. Add special instructions when build restrictions alone aren&apos;t enough.
                </Typography>
              </CardContent>
              <CardActions>
                <Button onClick={initiateTwitchLogin} size="small">
                  Get started
                </Button>
              </CardActions>
            </Card>
            <Card sx={{ maxWidth: 350 }}>
              <CardMedia>
                <StaticImage alt="Build submission" src="../../assets/images/build-submission.png" />
              </CardMedia>
              <CardContent>
                <Typography component="div" gutterBottom variant="h5">
                  No more transcribing builds or explaining rules
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  Whisper fans a unique URL they use to submit a build. Only builds fitting your options will be
                  allowed. Additionally, the build submission form features options for random builds!
                </Typography>
              </CardContent>
              <CardActions>
                <Button onClick={initiateTwitchLogin} size="small">
                  Activate account
                </Button>
              </CardActions>
            </Card>
            <Card sx={{ maxWidth: 350 }}>
              <CardMedia>
                <StaticImage alt="Mark build complete" src="../../assets/images/build-complete.png" />
              </CardMedia>
              <CardContent>
                <Typography component="div" gutterBottom variant="h5">
                  Track your builds
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  Marking a build as complete is as easy as clicking a button. Make a mistake? Another button click will
                  set you right. Completed builds drop off your build list after a few hours, keeping your build list
                  clutter-free while giving you the chance to go back if you need to.
                </Typography>
              </CardContent>
              <CardActions>
                <Button onClick={initiateTwitchLogin} size="small">
                  Let&apos;s go
                </Button>
              </CardActions>
            </Card>
            <Card sx={{ maxWidth: 350 }}>
              <CardMedia>
                <StaticImage alt="Mark build complete" src="../../assets/images/build-list.png" />
              </CardMedia>
              <CardContent>
                <Typography component="div" gutterBottom variant="h5">
                  Publicize your build list
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  Fans can track your build progress by finding you on the channel list or by using your custom URL
                  direct to your build list.
                </Typography>
              </CardContent>
              <CardActions>
                <Button onClick={initiateTwitchLogin} size="small">
                  I&apos;m in
                </Button>
              </CardActions>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </>
  )
}

export default SignUpCta
