import Button from '@mui/material/Button'
import { Link } from 'gatsby'
import LoginIcon from '@mui/icons-material/Login'
import React from 'react'
import Typography from '@mui/material/Typography'

export interface LoggedOutBarProps {
  initiateTwitchLogin: () => void
}

const LoggedOutBar = ({ initiateTwitchLogin }: LoggedOutBarProps): JSX.Element => {
  return (
    <>
      <Typography sx={{ flexGrow: 1 }} variant="h6">
        <Link style={{ color: '#fff', textDecoration: 'none' }} to="/">
          DBD Build Maker
        </Link>
      </Typography>
      <Button
        onClick={initiateTwitchLogin}
        startIcon={<LoginIcon />}
        sx={{ borderColor: '#fff', color: '#fff' }}
        variant="outlined"
      >
        Twitch Sign In
      </Button>
    </>
  )
}

export default LoggedOutBar
