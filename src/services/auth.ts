import Cookies from 'universal-cookie'
import { navigate } from 'gatsby'

export const twitchClientId = process.env.GATSBY_TWITCH_CLIENT_ID as string

/* Access token */

export const getAccessToken = (): string | null => {
  const cookies = new Cookies()
  const result = typeof window !== 'undefined' && cookies.get('access_token')
  if (result !== undefined && result !== '') {
    return result
  }
  const access_token = new URLSearchParams(window.location.hash.slice(1)).get('access_token')
  cookies.set('access_token', access_token ?? '', { path: '/', sameSite: 'strict', secure: true })
  history.replaceState(null, document.title, window.location.pathname)
  return access_token
}

export const removeAccessToken = (): void => {
  const cookies = new Cookies()
  cookies.set('access_token', '', { path: '/', sameSite: 'strict', secure: true })
}

/* Login */

export const initiateTwitchLogin = (): void => {
  const cookies = new Cookies()
  const currentCookie = cookies.get('return_url')
  if (currentCookie === undefined || currentCookie === '') {
    cookies.set('return_url', window.location.pathname, { path: '/', sameSite: 'strict', secure: true })
  }
  navigate(
    `https://id.twitch.tv/oauth2/authorize?response_type=token&client_id=${encodeURIComponent(
      twitchClientId
    )}&redirect_uri=${encodeURIComponent(window.location.origin)}&scope=${encodeURIComponent('moderation:read')}`
  )
}

export const redirectLogin = (): void => {
  const cookies = new Cookies()
  const currentCookie = cookies.get('return_url')
  if (currentCookie !== undefined && currentCookie !== '') {
    cookies.set('return_url', '', { path: '/', sameSite: 'strict', secure: true })
    navigate(currentCookie)
  }
}
