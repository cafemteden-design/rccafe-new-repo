import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient.js'
import * as localStore from './rewardStore.js'

export const rewardRepositoryMode = isSupabaseConfigured ? 'supabase' : 'local'

export async function createRewardCard(input) {
  if (!supabase) return localStore.createRewardCard(input)
  const { data, error } = await supabase.rpc('register_reward_card', {
    p_full_name: input.name,
    p_mobile: input.phone,
    p_email: input.email || null,
    p_date_of_birth: input.dob
  })
  if (error) throw error
  const result = Array.isArray(data) ? data[0] : data
  return getRewardCardByToken(result.secure_token)
}

export async function authenticateRewardCard(cardId, dob) {
  if (!supabase) return localStore.authenticateRewardCard(cardId, dob)
  const { data, error } = await supabase.rpc('login_reward_card', {
    p_rcc_card_id: cardId,
    p_date_of_birth: dob
  })
  if (error) throw error
  const result = Array.isArray(data) ? data[0] : data
  if (!result?.secure_token) return null
  return getRewardCardByToken(result.secure_token)
}

export async function getRewardCardByToken(token) {
  if (!supabase) return localStore.getRewardCardByToken(token)
  const { data, error } = await supabase.rpc('get_reward_card_by_token', { p_secure_token: token })
  if (error) throw error
  return data || null
}

export function getRewardCardUrl(card) {
  return localStore.getRewardCardUrl(card)
}

export function getDemoRewardCard() {
  return localStore.seedDemoRewardCard()
}
