import {
  buildBatch,
  buildId,
  buildKiller,
  buildOptions,
  buildToken,
  buildTokenResponse,
  channel,
  channelBatch,
  channelId,
  createdChannel,
  jsonPatchOperations,
  submitter,
  twitchAuthToken,
  twitchAuthTokenStatus,
} from '@test/__mocks__'
import {
  createBuild,
  createBuildToken,
  createChannel,
  deleteChannel,
  fetchAllBuilds,
  fetchAllChannels,
  fetchBuildOptions,
  fetchBuildToken,
  fetchChannel,
  patchBuild,
  patchChannel,
  updateChannelMods,
  validateTwitchToken,
} from './build-maker'
import { http, HttpResponse, server } from '@test/setup-server'

const baseUrl = process.env.GATSBY_BUILD_MAKER_API_BASE_URL
jest.mock('@aws-amplify/analytics')

describe('Build maker service', () => {
  describe('channels', () => {
    describe('createChannel', () => {
      const postEndpoint = jest.fn().mockReturnValue(createdChannel)

      beforeAll(() => {
        server.use(
          http.post(`${baseUrl}/channels`, async ({ request }) => {
            if (`${twitchAuthToken}` !== request.headers.get('X-Twitch-Token')) {
              return new HttpResponse(JSON.stringify({ message: 'Invalid Twitch token' }), { status: 401 })
            }

            const body = postEndpoint()
            return body ? HttpResponse.json(body) : new HttpResponse(null, { status: 400 })
          }),
        )
      })

      test('expect result from call returned', async () => {
        const result = await createChannel(twitchAuthToken)
        expect(postEndpoint).toHaveBeenCalledTimes(1)
        expect(result).toEqual(createdChannel)
      })
    })

    describe('deleteChannel', () => {
      const deleteEndpoint = jest.fn().mockReturnValue(channel)

      beforeAll(() => {
        server.use(
          http.delete(`${baseUrl}/channels/:id`, async ({ params, request }) => {
            if (`${twitchAuthToken}` !== request.headers.get('X-Twitch-Token')) {
              return new HttpResponse(JSON.stringify({ message: 'Invalid Twitch token' }), { status: 401 })
            }

            const { id } = params
            const body = deleteEndpoint(id)
            return body ? HttpResponse.json(body) : new HttpResponse(null, { status: 400 })
          }),
        )
      })

      test('expect result from call returned', async () => {
        const result = await deleteChannel(channelId, twitchAuthToken)
        expect(deleteEndpoint).toHaveBeenCalledTimes(1)
        expect(result).toEqual(channel)
      })
    })

    describe('fetchChannel', () => {
      const getEndpoint = jest.fn().mockReturnValue(channel)

      beforeAll(() => {
        server.use(
          http.get(`${baseUrl}/channels/:id`, async ({ params }) => {
            const { id } = params
            const body = getEndpoint(id)
            return body ? HttpResponse.json(body) : new HttpResponse(null, { status: 400 })
          }),
        )
      })

      test('expect result from call returned', async () => {
        const result = await fetchChannel(channelId)
        expect(getEndpoint).toHaveBeenCalledWith(channelId)
        expect(result).toEqual(channel)
      })
    })

    describe('fetchAllChannels', () => {
      const getEndpoint = jest.fn().mockReturnValue(channelBatch)

      beforeAll(() => {
        server.use(
          http.get(`${baseUrl}/channels`, async () => {
            const body = getEndpoint()
            return body ? HttpResponse.json(body) : new HttpResponse(null, { status: 400 })
          }),
        )
      })

      test('expect result from call returned', async () => {
        const result = await fetchAllChannels()
        expect(getEndpoint).toHaveBeenCalledTimes(1)
        expect(result).toEqual(channelBatch)
      })
    })

    describe('patchChannel', () => {
      const patchEndpoint = jest.fn().mockReturnValue(channel)

      beforeAll(() => {
        server.use(
          http.patch(`${baseUrl}/channels/:id`, async ({ params, request }) => {
            if (`${twitchAuthToken}` !== request.headers.get('X-Twitch-Token')) {
              return new HttpResponse(JSON.stringify({ message: 'Invalid Twitch token' }), { status: 401 })
            }

            const { id } = params
            const body = patchEndpoint(id, await request.json())
            return body ? HttpResponse.json(body) : new HttpResponse(null, { status: 400 })
          }),
        )
      })

      test('expect result from call returned', async () => {
        const result = await patchChannel(channelId, jsonPatchOperations, twitchAuthToken)
        expect(patchEndpoint).toHaveBeenCalledWith(channelId, jsonPatchOperations)
        expect(result).toEqual(channel)
      })
    })

    describe('updateChannelMods', () => {
      const updateModsEndpoint = jest.fn()

      beforeAll(() => {
        server.use(
          http.post(`${baseUrl}/channels/:id/update-mods`, async ({ params, request }) => {
            if (`${twitchAuthToken}` !== request.headers.get('X-Twitch-Token')) {
              return new HttpResponse(JSON.stringify({ message: 'Invalid Twitch token' }), { status: 401 })
            }

            const { id } = params
            updateModsEndpoint(id)
            return HttpResponse.json({})
          }),
        )
      })

      test('expect result from call returned', async () => {
        const result = await updateChannelMods(channelId, twitchAuthToken)
        expect(updateModsEndpoint).toHaveBeenCalledWith(channelId)
        expect(result).toEqual({})
      })
    })
  })

  describe('build tokens', () => {
    describe('createBuildToken', () => {
      const postEndpoint = jest.fn().mockReturnValue(buildToken)

      beforeAll(() => {
        server.use(
          http.post(`${baseUrl}/channels/:id/tokens`, async ({ params, request }) => {
            if (`${twitchAuthToken}` !== request.headers.get('X-Twitch-Token')) {
              return new HttpResponse(JSON.stringify({ message: 'Invalid Twitch token' }), { status: 401 })
            }

            const { id } = params
            const body = postEndpoint(id, await request.json())
            return body ? HttpResponse.json(body) : new HttpResponse(null, { status: 400 })
          }),
        )
      })

      test('expect result from call returned', async () => {
        const result = await createBuildToken(channelId, twitchAuthToken, submitter)
        expect(postEndpoint).toHaveBeenCalledWith(channelId, { submitter })
        expect(result).toEqual(buildToken)
      })
    })

    describe('fetchBuildToken', () => {
      const getEndpoint = jest.fn().mockReturnValue(buildTokenResponse)

      beforeAll(() => {
        server.use(
          http.get(`${baseUrl}/channels/:id/tokens/:token`, async ({ params }) => {
            const { id, token } = params
            const body = getEndpoint(id, token)
            return body ? HttpResponse.json(body) : new HttpResponse(null, { status: 400 })
          }),
        )
      })

      test('expect result from call returned', async () => {
        const result = await fetchBuildToken(channelId, buildToken.value)
        expect(getEndpoint).toHaveBeenCalledWith(channelId, buildToken.value)
        expect(result).toEqual(buildTokenResponse)
      })
    })
  })

  describe('build options', () => {
    describe('fetchBuildOptions', () => {
      const getEndpoint = jest.fn().mockReturnValue(buildOptions)

      beforeAll(() => {
        server.use(
          http.get(`${baseUrl}/build-options`, async () => {
            const body = getEndpoint()
            return body ? HttpResponse.json(body) : new HttpResponse(null, { status: 400 })
          }),
        )
      })

      test('expect result from call returned', async () => {
        const result = await fetchBuildOptions()
        expect(getEndpoint).toHaveBeenCalledTimes(1)
        expect(result).toEqual(buildOptions)
      })
    })
  })

  describe('builds', () => {
    describe('createBuild', () => {
      const putEndpoint = jest.fn().mockReturnValue(buildKiller)

      beforeAll(() => {
        server.use(
          http.put(`${baseUrl}/channels/:id/builds/:buildId`, async ({ params, request }) => {
            const { buildId, id } = params
            const body = putEndpoint(id, buildId, await request.json())
            return body ? HttpResponse.json(body) : new HttpResponse(null, { status: 400 })
          }),
        )
      })

      test('expect result from call returned', async () => {
        const result = await createBuild(channelId, buildId, buildKiller)
        expect(putEndpoint).toHaveBeenCalledWith(channelId, buildId, buildKiller)
        expect(result).toEqual(buildKiller)
      })
    })

    describe('fetchAllBuilds', () => {
      const getEndpoint = jest.fn().mockReturnValue(buildBatch)

      beforeAll(() => {
        server.use(
          http.get(`${baseUrl}/channels/:id/builds`, async ({ params }) => {
            const { id } = params
            const body = getEndpoint(id)
            return body ? HttpResponse.json(body) : new HttpResponse(null, { status: 400 })
          }),
        )
      })

      test('expect result from call returned', async () => {
        const result = await fetchAllBuilds(channelId)
        expect(getEndpoint).toHaveBeenCalledWith(channelId)
        expect(result).toEqual(buildBatch)
      })
    })

    describe('patchBuild', () => {
      const patchEndpoint = jest.fn().mockReturnValue(buildKiller)

      beforeAll(() => {
        server.use(
          http.patch(`${baseUrl}/channels/:id/builds/:buildId`, async ({ params, request }) => {
            if (`${twitchAuthToken}` !== request.headers.get('X-Twitch-Token')) {
              return new HttpResponse(JSON.stringify({ message: 'Invalid Twitch token' }), { status: 401 })
            }

            const { buildId, id } = params
            const body = patchEndpoint(id, buildId, await request.json())
            return body ? HttpResponse.json(body) : new HttpResponse(null, { status: 400 })
          }),
        )
      })

      test('expect result from call returned', async () => {
        const result = await patchBuild(channelId, buildId, jsonPatchOperations, twitchAuthToken)
        expect(patchEndpoint).toHaveBeenCalledWith(channelId, buildId, jsonPatchOperations)
        expect(result).toEqual(buildKiller)
      })
    })
  })

  describe('Twitch tokens', () => {
    describe('validateTwitchToken', () => {
      const getEndpoint = jest.fn().mockReturnValue(twitchAuthTokenStatus)

      beforeAll(() => {
        server.use(
          http.get(`${baseUrl}/twitch/validate-token`, async ({ request }) => {
            if (`${twitchAuthToken}` !== request.headers.get('X-Twitch-Token')) {
              return new HttpResponse(JSON.stringify({ message: 'Invalid Twitch token' }), { status: 401 })
            }

            const body = getEndpoint()
            return body ? HttpResponse.json(body) : new HttpResponse(null, { status: 400 })
          }),
        )
      })

      test('expect result from call returned', async () => {
        const result = await validateTwitchToken(twitchAuthToken)
        expect(getEndpoint).toHaveBeenCalledTimes(1)
        expect(result).toEqual(twitchAuthTokenStatus)
      })
    })
  })
})
