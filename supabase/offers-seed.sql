-- ============================================================================
-- RCC Cafe — Reward offers seed for public.reward_offers
-- ----------------------------------------------------------------------------
-- Safe to run multiple times. Inserts the default welcome offer only if it does
-- not already exist (matched by title), so it never creates duplicates and
-- never overwrites edits made in the admin Offers module.
-- ============================================================================

insert into public.reward_offers (title, description, offer_type, active, priority)
select
  'Buy 1 Get 1 Toastie',
  'Buy one toastie and receive a second toastie with the RCC welcome offer.',
  'welcome',
  true,
  100
where not exists (
  select 1 from public.reward_offers where title = 'Buy 1 Get 1 Toastie'
);
