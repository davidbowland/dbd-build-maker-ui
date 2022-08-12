import { navigate } from 'gatsby'

export const twitchClientId = process.env.GATSBY_TWITCH_CLIENT_ID as string

export const getAccessToken = (): string | null =>
  new URLSearchParams(window.location.hash.slice(1)).get('access_token')

export const initiateTwitchLogin = (): void => {
  navigate(
    `https://id.twitch.tv/oauth2/authorize?response_type=token&client_id=${encodeURIComponent(
      twitchClientId
    )}&redirect_uri=${encodeURIComponent(window.location.origin)}&scope=${encodeURIComponent('moderation:read')}`
  )
}
