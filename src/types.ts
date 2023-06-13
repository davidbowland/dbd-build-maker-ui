export { CognitoUserAmplify } from '@aws-amplify/ui'
export { Operation as PatchOperation } from 'fast-json-patch'
export { Theme } from '@mui/material/styles'

export interface Build {
  addon1: string
  addon2: string
  character: string
  completed?: number
  expiration: number
  item?: string
  notes?: string
  offering: string
  perk1: string
  perk2: string
  perk3: string
  perk4: string
  submitter?: string
}

export interface BuildBatch {
  channelId: string
  data: Build
  id: string
}

export interface BuildSubmission {
  addon1: string
  addon2: string
  character: string
  completed?: number
  expiration?: number
  item: string
  notes: string
  offering: string
  perk1: string
  perk2: string
  perk3: string
  perk4: string
}

export interface BuildTokenResponse {
  submitter: string
}

export interface ChannelCounts {
  completed: number
  pending: number
}

export interface ChannelMod {
  user_id: string
  user_login: string
  user_name: string
}

export interface Channel {
  counts: ChannelCounts
  disabledOptions: string[]
  lastModified: number
  mods: ChannelMod[]
  name: string
  notes?: string
  pic: string
}

export interface ChannelBatch {
  data: Channel
  id: string
}

export interface CreatedChannel {
  channelId: string
  counts: ChannelCounts
  disabledOptions: string[]
  lastModified: number
  mods: ChannelMod[]
  name: string
  notes?: string
  pic: string
}

export interface StringObject {
  [key: string]: any
}

export interface Token {
  expiration: number
  value: string
}

export interface TwitchTokenStatus {
  id?: string
  name?: string
  status: 'valid' | 'invalid'
}

export interface User {
  expiresIn: number
  id: string
  name: string
}

/* Build options */

export type Addons = string[]

export interface KillerCharacters {
  [key: string]: Addons
}

export interface Items {
  [key: string]: Addons
}

export type SurvivorCharacters = string[]
export type Offerings = string[]
export type Perks = string[]

export interface Killer {
  characters: KillerCharacters
  offerings: Offerings
  perks: Perks
}

export interface Survivor {
  characters: SurvivorCharacters
  items: Items
  offerings: Offerings
  perks: Perks
}

export interface BuildOptions {
  killer: Killer
  survivor: Survivor
}
