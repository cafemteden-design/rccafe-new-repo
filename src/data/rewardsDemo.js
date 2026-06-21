// Compatibility facade. The browser adapter is isolated so a future Supabase
// repository can replace it without touching booking or rewards UI components.
export {
  REWARD_MAX_STAMPS,
  addRewardNotification,
  addRewardOffer,
  addRewardStamp,
  authenticateRewardCard,
  createRewardCard,
  getRewardCardByCardId,
  getRewardCardByToken,
  getRewardCardUrl,
  getRewardCards,
  getRewardProgram,
  redeemReward,
  rewardSignupGiftDescription,
  rewardSignupGiftTitle,
  seedDemoRewardCard,
  updateSignupGift
} from '../services/rewards/rewardStore.js'
