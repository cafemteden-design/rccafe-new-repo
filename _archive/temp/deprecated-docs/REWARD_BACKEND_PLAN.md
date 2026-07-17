# RCC Cafe – Reward Card Backend Plan (Supabase)

> **STATUS: PLAN ONLY — NOT EXECUTED.**
> No tables, policies, or functions below have been created in Supabase.
> Run only after explicit approval. The current `localStorage` reward demo stays live until then.

---

## 1. High-Level Architecture

```
Customer browser ──┐
                   ├──► Supabase (Postgres + RLS + Auth) ◄── Staff browser (logged in)
Public card link ──┘
```

- **Frontend:** existing React app, using the ANON key only via `src/lib/supabaseClient.js`.
- **Data access:** thin service modules in `src/services/` (e.g. `rewardCardsService.js`).
- **Auth:** Supabase Auth for staff/admin only. Customers are anonymous, identified by a `secure_token` in their card URL.
- **Integrity rules** (duplicate-day block, unlock at 7, cycle reset) enforced **server-side** via Postgres functions, not just the UI.

---

## 2. Proposed Tables

### `reward_cards`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK default `gen_random_uuid()` | |
| `card_id` | `text` unique | human-readable e.g. `RCC-1001` |
| `secure_token` | `text` unique | random, used in public URL |
| `full_name` | `text` | |
| `email` | `text` | nullable |
| `mobile` | `text` | |
| `current_stamps` | `int` default 0 | 0–7 |
| `cycle_number` | `int` default 1 | |
| `reward_status` | `text` default `'collecting'` | `collecting` \| `unlocked` |
| `created_at` | `timestamptz` default `now()` | |
| `updated_at` | `timestamptz` default `now()` | |

### `reward_events`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `card_id` | `uuid` FK → `reward_cards.id` on delete cascade | |
| `event_type` | `text` | `card_created` \| `stamp_added` \| `reward_redeemed` |
| `stamp_number` | `int` | nullable |
| `cycle_number` | `int` | |
| `created_at` | `timestamptz` default `now()` | |
| `created_by` | `uuid` FK → `staff_users.id` | nullable (system/customer) |

### `staff_users`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK (matches `auth.users.id`) | |
| `email` | `text` unique | |
| `role` | `text` default `'staff'` | `staff` \| `admin` |
| `active` | `boolean` default `true` | |
| `created_at` | `timestamptz` default `now()` | |

---

## 3. Planned SQL (DO NOT RUN UNTIL APPROVED)

```sql
-- 0001_reward_schema.sql  (PLANNED)
create extension if not exists "pgcrypto";

create table reward_cards (
  id uuid primary key default gen_random_uuid(),
  card_id text unique not null,
  secure_token text unique not null,
  full_name text not null,
  email text,
  mobile text not null,
  current_stamps int not null default 0 check (current_stamps between 0 and 7),
  cycle_number int not null default 1,
  reward_status text not null default 'collecting'
    check (reward_status in ('collecting','unlocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table staff_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  role text not null default 'staff' check (role in ('staff','admin')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table reward_events (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references reward_cards(id) on delete cascade,
  event_type text not null
    check (event_type in ('card_created','stamp_added','reward_redeemed')),
  stamp_number int,
  cycle_number int not null,
  created_at timestamptz not null default now(),
  created_by uuid references staff_users(id)
);

create index on reward_events (card_id, created_at desc);
```

### Planned server-side logic (RPC functions, PLANNED)

- `add_stamp(p_card_id uuid)` — `security definer` function that:
  - rejects if `reward_status = 'unlocked'`,
  - rejects if an `stamp_added` event already exists today (Pacific/Auckland) for the card,
  - increments `current_stamps`, sets `unlocked` at 7,
  - inserts a `reward_events` row, stamps `updated_at`.
- `redeem_reward(p_card_id uuid)` — resets stamps to 0, increments `cycle_number`, sets `collecting`, logs `reward_redeemed`.
- `register_card(...)` — public-callable, creates card + `card_created` event, returns `secure_token`.

Enforcing these in SQL guarantees the rules even if the UI is bypassed.

---

## 4. Reward Card Flow (Future Live)

**Customer**
1. Registers (name, mobile, optional email) → `register_card` returns a unique `secure_token`.
2. Receives card URL `/rewards/card/:token`.
3. Opens anytime → reads card by token (RLS allows read of single row by token).
4. Sees latest stamp count, cycle, reward status.

**Staff**
1. Logs in (Supabase Auth, must exist in `staff_users` and be `active`).
2. Scans customer QR (encodes the secure token).
3. Calls `add_stamp` → stamp added (duplicate-day blocked server-side).
4. At 7 stamps → reward unlocked; calls `redeem_reward` after giving gift.

**System guarantees**
- No duplicate same-day stamps (server check).
- Unlock exactly at 7 stamps.
- Cycle resets to a fresh 7 after redemption.
- Full immutable history in `reward_events`.

---

## 5. Migration Strategy From Demo

- Phase A (now): infra ready, demo still uses `localStorage`.
- Phase B (after approval): create tables + RPCs, add `src/services/rewardCardsService.js`.
- Phase C: feature-flag reward pages to use Supabase service instead of `rewardsDemo.js` (keep demo as fallback).
- Phase D: remove demo once verified live.
