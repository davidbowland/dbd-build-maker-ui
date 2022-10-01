import { Amplify, Auth } from 'aws-amplify'
import { Analytics } from '@aws-amplify/analytics'

const identityPoolId = process.env.GATSBY_IDENTITY_POOL_ID
const buildMakerBaseUrl = process.env.GATSBY_BUILD_MAKER_API_BASE_URL

// Authorization

export const buildMakerApiNameUnauthenticated = 'BuildMakerAPIGatewayUnauthenticated'

Amplify.configure({
  API: {
    endpoints: [
      {
        endpoint: buildMakerBaseUrl,
        name: buildMakerApiNameUnauthenticated,
      },
    ],
  },
  Auth: {
    identityPoolId,
    mandatorySignIn: false,
    region: identityPoolId.split(':')[0],
  },
})

// Analytics

const appId = process.env.GATSBY_PINPOINT_ID

const analyticsConfig = {
  AWSPinpoint: {
    appId,
    region: 'us-east-1',
  },
}

Analytics.configure(analyticsConfig)

Analytics.autoTrack('session', {
  // REQUIRED, turn on/off the auto tracking
  enable: true,
})

Analytics.autoTrack('pageView', {
  // REQUIRED, turn on/off the auto tracking
  enable: true,
})

Analytics.autoTrack('event', {
  // REQUIRED, turn on/off the auto tracking
  enable: true,
})

Auth.configure(analyticsConfig)
