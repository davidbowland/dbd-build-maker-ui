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
import { rest, server } from '@test/setup-server'

const baseUrl = process.env.GATSBY_BUILD_MAKER_API_BASE_URL
jest.mock('@aws-amplify/analytics')

describe('Build maker service', () => {
  describe('channels', () => {
    describe('createChannel', () => {
      const postEndpoint = jest.fn().mockReturnValue(createdChannel)

      beforeAll(() => {
        server.use(
          rest.post(`${baseUrl}/channels`, async (req, res, ctx) => {
            if (`${twitchAuthToken}` !== req.headers.get('X-Twitch-Token')) {
              return res(ctx.status(401))
            }

            const body = postEndpoint()
            return res(body ? ctx.json(body) : ctx.status(400))
          })
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
          rest.delete(`${baseUrl}/channels/:id`, async (req, res, ctx) => {
            if (`${twitchAuthToken}` !== req.headers.get('X-Twitch-Token')) {
              return res(ctx.status(401))
            }

            const { id } = req.params
            const body = deleteEndpoint(id)
            return res(body ? ctx.json(body) : ctx.status(400))
          })
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
          rest.get(`${baseUrl}/channels/:id`, async (req, res, ctx) => {
            const { id } = req.params
            const body = getEndpoint(id)
            return res(body ? ctx.json(body) : ctx.status(400))
          })
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
          rest.get(`${baseUrl}/channels`, async (req, res, ctx) => {
            const body = getEndpoint()
            return res(body ? ctx.json(body) : ctx.status(400))
          })
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
          rest.patch(`${baseUrl}/channels/:id`, async (req, res, ctx) => {
            if (`${twitchAuthToken}` !== req.headers.get('X-Twitch-Token')) {
              return res(ctx.status(401))
            }

            const { id } = req.params
            const body = patchEndpoint(id, await req.json())
            return res(body ? ctx.json(body) : ctx.status(400))
          })
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
          rest.post(`${baseUrl}/channels/:id/update-mods`, async (req, res, ctx) => {
            if (`${twitchAuthToken}` !== req.headers.get('X-Twitch-Token')) {
              return res(ctx.status(401))
            }

            const { id } = req.params
            updateModsEndpoint(id)
            return res(ctx.json({}))
          })
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
          rest.post(`${baseUrl}/channels/:id/tokens`, async (req, res, ctx) => {
            if (`${twitchAuthToken}` !== req.headers.get('X-Twitch-Token')) {
              return res(ctx.status(401))
            }

            const { id } = req.params
            const body = postEndpoint(id, await req.json())
            return res(body ? ctx.json(body) : ctx.status(400))
          })
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
          rest.get(`${baseUrl}/channels/:id/tokens/:token`, async (req, res, ctx) => {
            const { id, token } = req.params
            const body = getEndpoint(id, token)
            return res(body ? ctx.json(body) : ctx.status(400))
          })
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
          rest.get(`${baseUrl}/build-options`, async (req, res, ctx) => {
            const body = getEndpoint()
            return res(body ? ctx.json(body) : ctx.status(400))
          })
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
          rest.put(`${baseUrl}/channels/:id/builds/:buildId`, async (req, res, ctx) => {
            const { buildId, id } = req.params
            const body = putEndpoint(id, buildId, await req.json())
            return res(body ? ctx.json(body) : ctx.status(400))
          })
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
          rest.get(`${baseUrl}/channels/:id/builds`, async (req, res, ctx) => {
            const { id } = req.params
            const body = getEndpoint(id)
            return res(body ? ctx.json(body) : ctx.status(400))
          })
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
          rest.patch(`${baseUrl}/channels/:id/builds/:buildId`, async (req, res, ctx) => {
            if (`${twitchAuthToken}` !== req.headers.get('X-Twitch-Token')) {
              return res(ctx.status(401))
            }

            const { buildId, id } = req.params
            const body = patchEndpoint(id, buildId, await req.json())
            return res(body ? ctx.json(body) : ctx.status(400))
          })
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
          rest.get(`${baseUrl}/twitch/validate-token`, async (req, res, ctx) => {
            if (`${twitchAuthToken}` !== req.headers.get('X-Twitch-Token')) {
              return res(ctx.status(401))
            }

            const body = getEndpoint()
            return res(body ? ctx.json(body) : ctx.status(400))
          })
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
