declare global {
  namespace NodeJS {
    interface ProcessEnv {
      GATSBY_BUILD_MAKER_API_BASE_URL: string
      GATSBY_IDENTITY_POOL_ID: string
      GATSBY_PINPOINT_ID: string
      GATSBY_REFRESH_INTERVAL_SECONDS: string
      GATSBY_TWITCH_CLIENT_ID: string
    }
  }
}

export {}
