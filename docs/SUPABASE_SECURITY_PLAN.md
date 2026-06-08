# RCC Cafe – Supabase Security Plan

> **STATUS: PLAN ONLY — NOT IMPLEMENTED.** Apply only after approval.

## 1. Key Handling

| Key | Where it lives | Exposure |
|-----|----------------|----------|
| `VITE_SUPABASE_URL` | `.env.local`, host env vars | Public, OK in frontend |
| `VITE_SUPABASE_ANON_KEY` | `.env.local`, host env vars | Public, RLS-protected |
| **Service Role Key** | local secret manager / server only | **NEVER** in repo, frontend, browser, or any `VITE_` var |

- `.env.local` is git-ignored; `.env.example` carries no real values.
- The service role key is only ever used in trusted server contexts (e.g. Supabase Edge Functions / Apps Script), never shipped to the browser.

## 2. Row Level Security (RLS) Strategy

Enable RLS on **all** reward tables. Default deny; add explicit policies.

### `reward_cards`
- **Customer read:** allow `select` of a single row only when the request supplies the matching `secure_token` (via a `security definer` RPC `get_card_by_token`, not a broad table policy). No anonymous full-table reads.
- **Customer insert:** only through `register_card` RPC (validates input, generates token).
- **Staff:** authenticated users in `staff_users` (`active = true`) may `select`/`update` via RPCs only.
- **No direct client `update`/`delete`** — all mutations go through `security definer` functions.

### `reward_events`
- **Insert/Update/Delete:** none from clients directly; only via RPCs.
- **Read:** staff (authenticated) and the card owner (by token via RPC).

### `staff_users`
- **Read:** a staff user can read their own row. Admins can read all.
- **Write:** admins only (or service role for provisioning).

## 3. Staff Access Strategy

- Staff authenticate with Supabase Auth (email/password or magic link).
- Authorization gate: row must exist in `staff_users` with `active = true`.
- `role = 'admin'` unlocks admin views (card list, analytics).
- Policies/RPCs check `auth.uid()` against `staff_users`.

## 4. Customer Access Strategy

- Customers are **anonymous** (no login).
- Identity = possession of the `secure_token` in their card URL.
- They can only read their own card via the token RPC; they cannot list, modify, or add stamps.

## 5. QR / Token Strategy

- `secure_token`: long, random, URL-safe (e.g. 32+ bytes base64url). Unguessable.
- QR encodes the card URL (`/rewards/card/:token`) or just the token.
- Adding a stamp requires **staff auth** + the token → possession of QR alone cannot self-stamp.
- Optional future hardening: rotate token on suspicious activity; short-lived signed action tokens for stamping.

## 6. Reward Card Security Summary

- All business rules (duplicate-day, unlock at 7, cycle reset) enforced server-side in SQL — UI cannot bypass.
- No secret keys in the bundle.
- RLS default-deny + RPC-only mutations = minimal attack surface.
- Immutable `reward_events` audit trail for disputes.

## 7. Pre-Go-Live Checklist (future)

- [ ] RLS enabled + tested on every table.
- [ ] Anon key confirmed cannot read other customers' cards.
- [ ] Service role key absent from repo/build (grep CI check).
- [ ] Staff-only RPCs reject anonymous calls.
- [ ] Rate limiting / abuse protection on `register_card`.
