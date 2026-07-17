import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient.js'
import * as localStore from './rewardStore.js'
import { syncGoogleSheet } from '../googleSheetSync.js'

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
  const card = await getRewardCardByToken(result.secure_token)
  syncGoogleSheet('rewardCardCreated', {
    reward_card_id: card?.id,
    card_number: card?.cardId,
    card_token: card?.token,
    customer_name: card?.name,
    email_address: card?.email,
    mobile_number: card?.phone,
    card_status: card?.rewardStatus,
    current_cycle: card?.cycle,
    current_stamps: card?.stampCount,
    lifetime_stamps: card?.totalStamps,
    welcome_gift_status: card?.welcomeGiftRedeemed ? 'Redeemed' : 'Available'
  }).catch(() => {})
  return card
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

export async function authenticateRewardCardByEmail(email, dob) {
  if (!supabase) return localStore.authenticateRewardCardByEmail(email, dob)
  const { data, error } = await supabase.rpc('login_reward_card_by_email', {
    p_email: String(email || '').trim().toLowerCase(),
    p_date_of_birth: dob
  })
  if (error) {
    if (error.code === 'PGRST202' || /login_reward_card_by_email/i.test(error.message || '')) {
      throw new Error('Email sign-in is awaiting the rewards backend update. Your existing reward card remains safe.')
    }
    throw error
  }
  const result = Array.isArray(data) ? data[0] : data
  if (!result?.secure_token) return null
  return getRewardCardByToken(result.secure_token)
}

export async function findRewardIdentityDuplicate(input) {
  if (!supabase) return localStore.findRewardIdentityDuplicate(input)
  const { data, error } = await supabase.rpc('check_reward_identity', {
    p_email: String(input.email || '').trim().toLowerCase(),
    p_mobile: String(input.phone || '').trim()
  })
  if (error) {
    if (error.code === 'PGRST202' || /check_reward_identity/i.test(error.message || '')) return ''
    throw error
  }
  const result = Array.isArray(data) ? data[0] : data
  return result?.duplicate_field || ''
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
