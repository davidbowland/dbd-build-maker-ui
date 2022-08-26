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
  submitter?: string
}

export interface BuildTokenResponse {
  submitter: string
}

export interface Channel {
  mods: string[]
  name: string
  notes?: string
  pic: string
}

export interface ChannelBatch {
  data: Channel
  id: string
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
export type Offerings = string[]
export type Perks = string[]

export interface Killers {
  [key: string]: Addons
}

export interface Items {
  [key: string]: Addons
}

export interface BuildOptions {
  Killers: Killers
  KillerOfferings: Offerings
  KillerPerks: Perks
  Survivors: string[]
  SurvivorItems: Items
  SurvivorPerks: Perks
  SurvivorOfferings: Offerings
}
