// Gatsby loader shim
global.___loader = {
  enqueue: jest.fn(),
}

// Environment variables
process.env.GATSBY_BUILD_MAKER_API_BASE_URL = 'http://localhost'
process.env.GATSBY_IDENTITY_POOL_ID = 'us-east-2:ko9kjhgt67uiklkjhgftyhf'
process.env.GATSBY_PINPOINT_ID = 'mjyuiokjhgtyujkoiuygv'
process.env.GATSBY_REFRESH_INTERVAL_SECONDS = '1'
process.env.GATSBY_TWITCH_CLIENT_ID = 'jhgfrtyhjkjgyjh'

window.URL.createObjectURL = jest.fn()
