import React, { useState } from 'react'
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded'
import Box from '@mui/material/Box'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import { Link } from 'gatsby'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import LogoutIcon from '@mui/icons-material/Logout'
import PrivacyTipIcon from '@mui/icons-material/PrivacyTip'
import SwipeableDrawer from '@mui/material/SwipeableDrawer'
import Typography from '@mui/material/Typography'

import { removeAccessToken } from '@services/auth'

export interface LoggedInBarProps {
  userName?: string
}

const LoggedInBar = ({ userName }: LoggedInBarProps): JSX.Element => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const closeMenu = (): void => {
    setIsDrawerOpen(false)
  }

  const openMenu = (): void => {
    setIsDrawerOpen(true)
  }

  return (
    <>
      <Typography sx={{ flexGrow: 1 }} variant="h6">
        <Link style={{ color: '#fff', textDecoration: 'none' }} to="/">
          DBD Build Maker
        </Link>
      </Typography>
      <Typography component="div">{userName}</Typography>
      <IconButton
        aria-controls="menu-appbar"
        aria-haspopup="true"
        aria-label="menu"
        color="inherit"
        edge="start"
        onClick={openMenu}
        size="large"
        sx={{ ml: 0.5 }}
      >
        <AccountCircleRoundedIcon />
      </IconButton>
      <SwipeableDrawer anchor="right" onClose={closeMenu} onOpen={openMenu} open={isDrawerOpen}>
        <Box onClick={closeMenu} role="presentation" sx={{ width: 250 }}>
          <List>
            <ListItem button component="a" href="/privacy-policy">
              <ListItemIcon>
                <PrivacyTipIcon />
              </ListItemIcon>
              <ListItemText primary="Privacy policy" />
            </ListItem>
            <ListItem
              button
              onClick={() => {
                closeMenu()
                removeAccessToken()
                window.location.reload()
              }}
            >
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Sign out" />
            </ListItem>
          </List>
          <Divider />
          <List>
            <ListItem button>
              <ListItemIcon>
                <CloseRoundedIcon />
              </ListItemIcon>
              <ListItemText primary="Close" />
            </ListItem>
          </List>
        </Box>
      </SwipeableDrawer>
    </>
  )
}

export default LoggedInBar
