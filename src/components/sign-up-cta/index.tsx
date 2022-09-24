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

export interface CtaCardProps {
  children: string | JSX.Element | JSX.Element[]
  cta: string
  img: JSX.Element
  title: string
}

const CtaCard = ({ children, cta, img, title }: CtaCardProps): JSX.Element => (
  <Grid item lg={4} md={6} sm={8} xs={12}>
    <Card>
      <CardMedia>{img}</CardMedia>
      <CardContent>
        <Typography component="div" gutterBottom variant="h5">
          {title}
        </Typography>
        <Typography color="text.secondary" variant="body2">
          {children}
        </Typography>
      </CardContent>
      <CardActions>
        <Button onClick={initiateTwitchLogin} size="small">
          {cta}
        </Button>
      </CardActions>
    </Card>
  </Grid>
)

const SignUpCta = (): JSX.Element => {
  return (
    <>
      <Grid container justifyContent="center" spacing={4} sx={{ minHeight: '100vh', paddingRight: 4, width: '100%' }}>
        <CtaCard
          cta="Sign in"
          img={<StaticImage alt="Twitch logo" src="../../assets/images/twitch-logo.png" />}
          title="Use your existing Twitch account"
        >
          There is no account to create. Once you log in on the Twitch website, you will be redirected back to this
          site. The only non-public information retrieved is the list of moderators for your channel. Moderators have
          the same access to builds that owners do.
        </CtaCard>
        <CtaCard
          cta="Get started"
          img={<StaticImage alt="Build options editing" src="../../assets/images/build-options.png" />}
          title="Manage which builds you offer"
        >
          Choose which killers, survivors, perks, addons, items, and offerings you&apos;re willing to play. Add special
          text instructions when build restrictions alone aren&apos;t enough.
        </CtaCard>
        <CtaCard
          cta="Activate account"
          img={<StaticImage alt="Build submission" src="../../assets/images/build-submission.png" />}
          title="No more transcribing builds or explaining rules"
        >
          Whisper fans a unique URL they use to submit a build or let your moderators enter builds. Only builds fitting
          your options will be allowed. Additionally, the build submission form features options for random builds!
        </CtaCard>
        <CtaCard
          cta="I'm in"
          img={<StaticImage alt="Build list" src="../../assets/images/build-list.png" />}
          title="Publicize your build list"
        >
          Fans can track your build progress by finding you on the channel list or by using your custom URL direct to
          your build list.
        </CtaCard>
        <CtaCard
          cta="Do it"
          img={<StaticImage alt="Build table" src="../../assets/images/build-table.png" />}
          title="Choose your display"
        >
          Switch to table view to sort and filter your builds or export them to CSV.
        </CtaCard>
        <CtaCard
          cta="Let's go"
          img={<StaticImage alt="Mark build complete" src="../../assets/images/mark-complete.png" />}
          title="Track your builds"
        >
          Marking a build as complete is as easy as clicking a button or having a moderator click the button for you.
          Completed builds can be viewed separately.
        </CtaCard>
        <CtaCard
          cta="Sounds good"
          img={<StaticImage alt="Delete channel" src="../../assets/images/delete-channel.png" />}
          title="Delete if you want"
        >
          Decide this isn&apos;t the service for you? Deleting your channel is quick and easy, so you don&apos;t need to
          commit to anything!
        </CtaCard>
      </Grid>
      <Grid container justifyContent="center">
        <Grid item maxWidth="600px">
          <Stack spacing={2}>
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
              Your account is free and we collect no personally identifiable information or contact information.
            </Typography>
          </Stack>
        </Grid>
      </Grid>
    </>
  )
}

export default SignUpCta
