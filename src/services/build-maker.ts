import { API } from 'aws-amplify'

import {
  Build,
  BuildBatch,
  BuildTokenResponse,
  Channel,
  ChannelBatch,
  CreatedChannel,
  PatchOperation,
  Token,
  TwitchTokenStatus,
} from '@types'
import { buildMakerApiNameUnauthenticated } from '@config/amplify'

/* Channels */

export const createChannel = (token: string): Promise<CreatedChannel> =>
  API.post(buildMakerApiNameUnauthenticated, '/channels', { body: {}, headers: { 'X-Twitch-Token': token } })

export const fetchChannel = (channelId: string): Promise<Channel> =>
  API.get(buildMakerApiNameUnauthenticated, `/channels/${encodeURIComponent(channelId)}`, {})

export const fetchAllChannels = (): Promise<ChannelBatch[]> =>
  API.get(buildMakerApiNameUnauthenticated, '/channels', {})

export const patchChannel = (channelId: string, patchOperations: PatchOperation[], token: string): Promise<Channel> =>
  API.patch(buildMakerApiNameUnauthenticated, `/channels/${encodeURIComponent(channelId)}`, {
    body: patchOperations,
    headers: { 'X-Twitch-Token': token },
  })

export const deleteChannel = (channelId: string, token: string): Promise<Channel> =>
  API.del(buildMakerApiNameUnauthenticated, `/channels/${encodeURIComponent(channelId)}`, {
    headers: { 'X-Twitch-Token': token },
  })

export const updateChannelMods = (channelId: string, token: string): Promise<void> =>
  API.post(buildMakerApiNameUnauthenticated, `/channels/${encodeURIComponent(channelId)}/update-mods`, {
    headers: { 'X-Twitch-Token': token },
  })

/* Build tokens */

export const createBuildToken = (channelId: string, token: string, submitter: string): Promise<Token> =>
  API.post(buildMakerApiNameUnauthenticated, `/channels/${encodeURIComponent(channelId)}/tokens`, {
    body: { submitter },
    headers: { 'X-Twitch-Token': token },
  })

export const fetchBuildToken = (channelId: string, token: string): Promise<BuildTokenResponse> =>
  API.get(
    buildMakerApiNameUnauthenticated,
    `/channels/${encodeURIComponent(channelId)}/tokens/${encodeURIComponent(token)}`,
    {}
  )

/* Build options */

export const fetchBuildOptions = (): Promise<any> => API.get(buildMakerApiNameUnauthenticated, '/build-options', {})

/* Builds */

export const createBuild = (channelId: string, buildId: string, build: Build): Promise<Build> =>
  API.put(
    buildMakerApiNameUnauthenticated,
    `/channels/${encodeURIComponent(channelId)}/builds/${encodeURIComponent(buildId)}`,
    { body: build }
  )

export const fetchAllBuilds = (channelId: string): Promise<BuildBatch[]> =>
  API.get(buildMakerApiNameUnauthenticated, `/channels/${encodeURIComponent(channelId)}/builds`, {})

export const patchBuild = (
  channelId: string,
  buildId: string,
  patchOperations: PatchOperation[],
  token: string
): Promise<Build> =>
  API.patch(
    buildMakerApiNameUnauthenticated,
    `/channels/${encodeURIComponent(channelId)}/builds/${encodeURIComponent(buildId)}`,
    { body: patchOperations, headers: { 'X-Twitch-Token': token } }
  )

/* Twitch tokens */

export const validateTwitchToken = (token: string): Promise<TwitchTokenStatus> =>
  API.get(buildMakerApiNameUnauthenticated, '/twitch/validate-token', { headers: { 'X-Twitch-Token': token } })
