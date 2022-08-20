import Cookies from 'universal-cookie'
import { navigate } from 'gatsby'

export const twitchClientId = process.env.GATSBY_TWITCH_CLIENT_ID as string

export const getAccessToken = (): string | null => {
  const cookies = new Cookies()
  const result = typeof window !== 'undefined' && cookies.get('access_token')
  if (result !== undefined && result !== 'null') {
    return result
  }
  const access_token = new URLSearchParams(window.location.hash.slice(1)).get('access_token')
  cookies.set('access_token', access_token, { path: '/', sameSite: 'none', secure: true })
  window.location.hash = '#'
  return access_token
}

export const removeAccessToken = (): void => {
  const cookies = new Cookies()
  cookies.remove('access_token')
}

export const initiateTwitchLogin = (): void => {
  navigate(
    `https://id.twitch.tv/oauth2/authorize?response_type=token&client_id=${encodeURIComponent(
      twitchClientId
    )}&redirect_uri=${encodeURIComponent(window.location.origin)}&scope=${encodeURIComponent('moderation:read')}`
  )
}
