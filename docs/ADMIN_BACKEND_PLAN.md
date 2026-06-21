# RCC Cafe – Admin Backend Master Plan

> **STATUS: PLANNING ONLY.** No code written, no tables created, no booking/CMS changes made.
> Google Sheet + Apps Script booking stays live and untouched. Reward system stays on `localStorage` demo until a phase is approved.
> Awaiting approval before any implementation.

---

## 0. Guiding Principles

- **Non-destructive:** the live website keeps working at every phase. New admin code is additive and feature-flagged.
- **Frontend stays public + read-only against RLS:** only the ANON key in the browser; service role never shipped.
- **Server-enforced rules:** reward integrity, stamp limits, and status transitions enforced in Postgres (RPC / policies), not just the UI.
- **CMS-driven frontend later:** website content moves from static JS files (`src/data/*`) to Supabase, read via a cached service layer so pages update "live" after save.
- **Separate admin app surface:** admin lives under `/admin/*` routes (or a separate build later), isolated from the public site bundle where possible.

---

## 1. Recommended Backend Architecture

```
                         ┌─────────────────────────────────────────┐
   Public visitors  ───► │  React Public Site (Vite)                │
                         │  - reads CMS content (cached)            │
                         │  - booking UI → Apps Script (Phase 1-4)  │
                         │  - reward card view (token)              │
                         └───────────────┬─────────────────────────┘
                                         │ ANON key + RLS
                                         ▼
   Owner / Staff   ───► Admin App  ───► Supabase (Postgres + Auth + Storage + Edge Fns)
   (login)              /admin/*         - RLS on every table
                                         - RPCs for mutations
                                         - Storage for media
                                         - Edge Functions for email/sync
                                         ▲
   Google Sheet  ◄───── Apps Script ─────┘ (Phase 5 sync bridge)
```

**Components**
- **Supabase Postgres** – single source of truth for rewards, CMS, packages, menu, SEO, settings (booking added later).
- **Supabase Auth** – staff/admin identity (email+password v1; mobile+password future).
- **Supabase Storage** – media library (images/posters; large videos via external links).
- **Supabase Edge Functions** – server-side jobs: email sending (Phase 7), booking sync (Phase 5), QR/stamp RPCs.
- **Service layer (`src/services/`)** – wraps all Supabase calls; the only place that talks to the DB. Public site reads through cached getters.
- **Admin routing** – protected `/admin/*` routes with role-based guards.

**Data-access pattern**
- Reads: client → service module → Supabase (RLS limits rows).
- Writes/sensitive logic: client → `security definer` RPC (validates + logs).
- Public content: service getters with in-memory + `localStorage` cache and a "content version" key for cheap invalidation.

---

## 2. Admin Module List

| # | Module | Purpose (one line) | Min Role |
|---|--------|--------------------|----------|
| 1 | Dashboard | KPIs + recent activity | Staff (limited) |
| 2 | Bookings | View/manage all bookings | Staff (status only) |
| 3 | Offline Bookings | Manual/weekend/event bookings | Manager |
| 4 | Reward Cards | Manage cards, stamps, redemptions | Staff (scan/stamp) |
| 5 | Packages | Manage play packages | Manager |
| 6 | Food & Drinks | Manage toastie/drink options | Manager |
| 7 | RC Machines / Games | Manage machine showcase | Manager |
| 8 | Gallery | Manage gallery photos | Manager |
| 9 | Videos / Reels | Manage video rail + IG reels | Manager |
| 10 | Website Content CMS | Edit page sections | Super Admin |
| 11 | Testimonials | Manage reviews | Manager |
| 12 | SEO Manager | Per-page meta/OG/schema | Super Admin |
| 13 | Email Templates | Manage email content | Super Admin |
| 14 | Notification Recipients | Manage who gets alerts | Super Admin |
| 15 | Media Library | Upload/organize assets | Manager |
| 16 | Staff Users | Manage admin/staff accounts | Super Admin |
| 17 | Settings | Global config (hours, theme, integrations) | Super Admin |
| 18 | Activity Logs | Audit trail | Super Admin |

### Module detail (Purpose / Fields / Actions / UI / Tables / Permissions / Frontend impact)

**1. Dashboard**
- *Purpose:* at-a-glance operations.
- *Fields/Widgets:* today/upcoming/pending/completed/cancelled bookings; reward cards created/unlocked/redeemed; popular package/toastie/drink; new leads; recent activity feed.
- *Actions:* drill-down links to modules; date-range toggle.
- *UI:* KPI cards grid + 2 charts + activity list.
- *Tables:* reads from `bookings`, `reward_cards`, `reward_events`, `activity_logs` (aggregations / views).
- *Permissions:* all roles; Staff sees a reduced set.
- *Frontend impact:* none (admin-only).

**2. Bookings**
- *Purpose:* manage incoming bookings.
- *Fields:* see "Booking data fields" in §5.
- *Actions:* filter (date/status/package), search (name/mobile/email), view detail, update status, add admin notes, mark food prepared, resend confirmation email, copy WhatsApp message, export CSV.
- *UI:* filter bar + paginated table + detail drawer/modal.
- *Tables:* `bookings`, `booking_status_history`.
- *Permissions:* Staff = status updates + notes; Manager/Super Admin = all.
- *Frontend impact:* none until Phase 5/6 (booking still via Apps Script).

**3. Offline Bookings**
- *Purpose:* manual bookings for weekends/holidays/events not allowed online.
- *Fields:* booking fields + `is_offline`, `event_type` (Saturday/Sunday/School Holiday/Public Holiday/Corporate/Private/Group).
- *Actions:* create manual booking bypassing Mon–Fri rule, edit, cancel.
- *UI:* "New Offline Booking" form with relaxed date rules.
- *Tables:* `bookings` (with `source = 'offline'`).
- *Permissions:* Manager+.
- *Frontend impact:* none.

**4. Reward Cards** — see §6.

**5. Packages**
- *Purpose:* manage play packages shown on site.
- *Fields:* name, slug, duration_minutes, price, includes[], badge (e.g. "Most Popular"), icon/image, active, sort_order, booking_available.
- *Actions:* add/edit/archive, reorder, toggle active.
- *UI:* sortable list + edit form.
- *Tables:* `packages`.
- *Permissions:* Manager+.
- *Frontend impact:* Booking/Home package sections read from `packages` (Phase 4).

**6. Food & Drinks**
- *Purpose:* manage toastie + drink options.
- *Fields:* label, type (`toastie`/`drink`), active, sort_order, required (bool), booking_available.
- *Actions:* add/edit/delete, reorder, toggle.
- *UI:* two lists (toasties, drinks) with inline edit.
- *Tables:* `food_options`, `drink_options`.
- *Permissions:* Manager+.
- *Frontend impact:* Booking selection lists (Phase 4).

**7. RC Machines / Games**
- *Purpose:* manage machine showcase.
- *Fields:* name, description, image, specs[], sort_order, active.
- *Tables:* `rc_machines`. *Permissions:* Manager+. *Frontend:* Machines page (Phase 4).

**8. Gallery**
- *Purpose:* manage gallery photos.
- *Fields:* media_id, caption, alt, category, sort_order, active.
- *Tables:* `gallery_items` (+ `media_library`). *Permissions:* Manager+. *Frontend:* Gallery page (Phase 4).

**9. Videos / Instagram Reels**
- *Purpose:* manage video rail + IG reels.
- *Fields:* title, source_type (`upload`/`youtube`/`instagram`), url/media_id, thumbnail, sort_order, active.
- *Tables:* `video_items`. *Permissions:* Manager+. *Frontend:* Home video section (Phase 4).

**10. Website Content CMS** — see §7.

**11. Testimonials**
- *Fields:* author, role/location, quote, rating, avatar (media), active, sort_order.
- *Tables:* `testimonials`. *Permissions:* Manager+. *Frontend:* Home testimonials (Phase 4).

**12. SEO Manager** — see §9.

**13. Email Templates** — see §8.

**14. Notification Recipients** — see §8.

**15. Media Library**
- *Purpose:* upload/organize assets in Supabase Storage.
- *Fields:* file, url, alt, category (Hero/Gallery/Packages/Menu/Machines/Posters/OG), width/height, size, uploaded_by.
- *Actions:* upload, replace, delete, copy URL, set alt, categorize.
- *UI:* grid with filters + uploader + detail panel.
- *Tables:* `media_library` (+ Storage bucket). *Permissions:* Manager+.
- *Frontend:* referenced by CMS/gallery/packages. *Note:* large videos via external links/Instagram.

**16. Staff Users**
- *Fields:* email, full_name, role (`super_admin`/`manager`/`staff`), active, last_login.
- *Actions:* invite, set role, activate/deactivate.
- *Tables:* `profiles`, `admin_roles`. *Permissions:* Super Admin.

**17. Settings**
- *Fields:* operating_days/hours, max_capacity, slot_duration, theme tokens, integration URLs (Apps Script), feature flags (e.g. `rewards_use_supabase`), WhatsApp template.
- *Tables:* `settings` (key/value). *Permissions:* Super Admin.
- *Frontend:* booking config + feature flags read here (Phase 4+).

**18. Activity Logs**
- *Fields:* actor, action, entity, entity_id, metadata(json), created_at.
- *Actions:* view/filter/export (read-only).
- *Tables:* `activity_logs`. *Permissions:* Super Admin.

---

## 3. Database Table Plan (proposed — NOT created)

> Columns are indicative. `id uuid pk default gen_random_uuid()`, `created_at`/`updated_at timestamptz` assumed on most tables. RLS enabled on **all**.

| Table | Purpose | Key Columns | Relationships | RLS Idea | Indexes |
|-------|---------|-------------|---------------|----------|---------|
| `profiles` | App user profile (mirrors `auth.users`) | id (=auth.uid), full_name, email, phone, active | 1:1 auth.users | self read; admin read all | email |
| `admin_roles` | Role assignment | user_id, role(super_admin/manager/staff) | →profiles | self read; super admin write | user_id |
| `bookings` | All bookings (online+offline) | booking_code, date, time, package_id, package_name, duration, price, toastie, drink, customer_name, email, phone, players, notes, status, payment_status, source, is_offline, event_type, admin_notes, food_prepared | →packages | staff read; staff update status; manager+ full | (date,status), (phone), (email) |
| `booking_status_history` | Status audit | booking_id, from_status, to_status, changed_by, note | →bookings,profiles | staff read; insert via RPC | (booking_id,created_at) |
| `packages` | Play packages | name, slug, duration_minutes, price, includes[], badge, icon, image_id, active, sort_order, booking_available | →media_library | public read (active); manager+ write | (active,sort_order) |
| `food_options` | Toastie options | label, active, sort_order, required, booking_available | — | public read (active); manager+ write | (active,sort_order) |
| `drink_options` | Drink options | label, active, sort_order, required, booking_available | — | public read (active); manager+ write | (active,sort_order) |
| `reward_cards` | Loyalty cards | card_id, secure_token, full_name, email, mobile, current_stamps, cycle_number, reward_status, disabled | →reward_events | token read via RPC; staff read; mutations via RPC | unique(card_id),unique(secure_token),(mobile) |
| `reward_events` | Immutable stamp/redeem log | card_id, event_type, stamp_number, cycle_number, created_by, reason | →reward_cards,profiles | staff read; insert via RPC only | (card_id,created_at) |
| `reward_cycles` | Per-cycle summary/history | card_id, cycle_number, started_at, completed_at, redeemed_at, stamps_in_cycle | →reward_cards | staff read; via RPC | (card_id,cycle_number) |
| `reward_settings` | Reward config | max_stamps(7), gift_label, duplicate_block_window, active | — | public read; super admin write | — |
| `website_pages` | Page registry | key(home/about/...), title, active | →website_sections | public read (active); super admin write | unique(key) |
| `website_sections` | CMS content blocks | page_id, section_key, type, content(json), media_ids[], active, sort_order, published | →website_pages,media_library | public read (active+published); super admin write | (page_id,sort_order) |
| `media_library` | Storage asset registry | url, storage_path, alt, category, width, height, size, uploaded_by | →profiles | public read; manager+ write | (category) |
| `gallery_items` | Gallery entries | media_id, caption, alt, category, sort_order, active | →media_library | public read (active); manager+ write | (active,sort_order) |
| `video_items` | Videos/reels | title, source_type, url, media_id, thumbnail, sort_order, active | →media_library | public read (active); manager+ write | (active,sort_order) |
| `rc_machines` | Machine showcase | name, description, image_id, specs[], sort_order, active | →media_library | public read (active); manager+ write | (active,sort_order) |
| `testimonials` | Reviews | author, location, quote, rating, avatar_id, active, sort_order | →media_library | public read (active); manager+ write | (active,sort_order) |
| `seo_pages` | Per-page SEO | page_key, seo_title, meta_description, keywords, og_title, og_description, og_image_id, canonical_url, schema_type, local_seo(json) | →media_library | public read; super admin write | unique(page_key) |
| `email_templates` | Email content | key, subject, body, variables[], active | — | super admin read/write | unique(key) |
| `email_recipients` | Notification targets | name, email, type, active, notes | — | super admin read/write | (type,active) |
| `settings` | Global config | key, value(json), description | — | public read (safe keys) / super admin write | unique(key) |
| `activity_logs` | Audit trail | actor_id, action, entity, entity_id, metadata(json) | →profiles | super admin read; insert via RPC/triggers | (created_at),(entity,entity_id) |

**Views (read models):** `v_dashboard_stats`, `v_popular_packages`, `v_reward_summary` for cheap dashboard reads.

---

## 4. Role / Permission Plan

**Roles:** `super_admin`, `manager`, `staff`.

| Capability | Super Admin | Manager | Staff |
|------------|:----------:|:-------:|:-----:|
| Manage staff users / roles | ✅ | ❌ | ❌ |
| Website CMS / SEO / settings | ✅ | ❌ | ❌ |
| Email templates / recipients | ✅ | ❌ | ❌ |
| Packages / menu / machines | ✅ | ✅ | ❌ |
| Gallery / videos / testimonials | ✅ | ✅ | ❌ |
| Media library | ✅ | ✅ | view |
| Bookings: view | ✅ | ✅ | ✅ |
| Bookings: update status / notes | ✅ | ✅ | ✅ |
| Bookings: create offline / delete | ✅ | ✅ | ❌ |
| Reward: scan QR + add stamp | ✅ | ✅ | ✅ |
| Reward: manual adjust / disable card | ✅ | ✅ | ❌ |
| Reward analytics / export | ✅ | ✅ | ❌ |
| Activity logs | ✅ | view | ❌ |

**Mechanics**
- Role stored in `admin_roles`; resolved on login into the admin session.
- **Protected routes:** `/admin/*` guarded by an `AuthGuard` (must be logged in) + `RoleGuard` (route → min role).
- **Permission-based sidebar:** menu items filtered by role.
- **RLS** mirrors the table above server-side so a tampered UI still can't exceed permissions.
- **Auth flows:** login (email+password), logout, forgot/reset password (Supabase email). Future: mobile+password.

---

## 5. Booking Migration Strategy

**Recommendation: phased, low-risk migration. Do NOT replace Apps Script now.**

- **Phase 1 (now):** Google Sheet + Apps Script remains the single source of truth. Admin does not write bookings.
- **Phase 2 (mirror/read):** Admin **reads** bookings — either (a) Apps Script exposes a JSON read endpoint the admin consumes, or (b) a scheduled Edge Function pulls the sheet into a `bookings` mirror table for fast filtering/search. Sheet stays authoritative.
- **Phase 3 (dual-write/sync):** New bookings written to both Sheet (existing flow) and Supabase via a sync bridge. Validate parity over time.
- **Phase 4 (cutover):** Once verified, Supabase becomes source of truth; Apps Script kept as fallback/email sender, then retired.

**Option A vs B**
- *Option A (keep Sheet as main, sync later):* lowest risk — chosen for Phases 1–3.
- *Option B (full Supabase booking):* target end-state at Phase 6 after parity testing.

**Admin booking features (all phases):** view all, filter by date/status/package, search name/mobile/email, view detail, update status (Pending/Confirmed/Completed/Cancelled/Rescheduled/No Show), admin notes, add manual/offline booking, mark food prepared, resend confirmation, copy WhatsApp message, export CSV.

**Booking data fields:** Booking ID, Date, Time, Package Name, Duration, Price, Toastie, Drink, Customer Name/Email/Phone, Players, Notes, Status, Payment Status, Source, Admin Notes, Created/Updated At.

**Special logic**
- *Online:* Seven days a week, with a maximum of 8 remote spots per time slot.
- *Offline/manual:* Saturday, Sunday, School Holidays, Public Holidays, Corporate Events, Private Functions, Group Bookings — created only via admin, bypassing the Mon–Fri guard.

---

## 6. Reward Backend Strategy

(Builds on existing `docs/REWARD_BACKEND_PLAN.md` + `docs/SUPABASE_SECURITY_PLAN.md`.)

**Customer:** register once → unique digital card + secure token URL → open anytime → view stamp count. No login.
**Staff:** login → scan QR → add 1 stamp → redeem gift.

**Rules (server-enforced):** 1 visit = 1 stamp; 7 stamps = gift unlocked; same-day duplicate blocked; redeem resets to 0 and starts next cycle; full history retained in `reward_events` + `reward_cycles`.

**Admin reward management:** view all cards, search (name/mobile/card ID), view details + stamp history, manual add/remove stamp **with reason** (logged), redeem gift, export leads, disable fraudulent cards, reward analytics.

**Tables:** `reward_cards`, `reward_events`, `reward_cycles`, `reward_settings`.

**Security:** customer cannot add stamps; staff must be authenticated; QR encodes `secure_token` (not card ID); RLS on all tables; mutations through `security definer` RPCs (`register_card`, `add_stamp`, `redeem_reward`, `admin_adjust_stamp`).

**Migration from demo:** keep `localStorage` demo as fallback behind a `rewards_use_supabase` flag in `settings`; switch on after verification.

---

## 7. CMS Strategy

**Goal:** edit frontend content without a developer; changes reflect live after save.

**Model:** `website_pages` → `website_sections` (typed JSON content + media refs). Sections are keyed (e.g. `home.hero`, `home.about`, `home.rewards`, `home.packages`, `home.machines`, `home.video`, `home.gallery`, `home.testimonials`, `home.contact`) with `active` + `sort_order`.

**Editable content**
- *Home:* hero title/subtitle/image-or-video, CTA text/link, about, reward, package, machines, video, gallery, testimonials, contact details.
- *Other pages:* About, RC Machines, Booking page notices, Rewards text, Menu, Gallery, Contact.

**CMS requirements:** section-wise editor, image/video replacement (via Media Library), multiple images, active/inactive sections, sort order, draft/publish (future), live update after save.

**Live-update mechanism**
- Public site reads content through a cached service getter keyed by a `content_version` in `settings`.
- On save, admin bumps `content_version` → clients fetch fresh content (no redeploy).
- Migration: seed Supabase from current `src/data/*` files; switch each page behind a `cms_enabled` flag, page by page.

---

## 8. Email Strategy

**Current:** Apps Script sends booking emails. **Keep this for bookings short-term (Option A).**

- **Phase 1–4:** Apps Script continues sending booking emails.
- **Phase 7:** move sending to a Supabase **Edge Function + email provider** (e.g. Resend/SendGrid) for reward + status emails, then optionally migrate booking emails.

**Templates (managed in admin):** new booking admin notification, customer booking confirmation, status confirmed, cancelled, rescheduled, reward card created, reward gift unlocked, reward gift redeemed.

**Template management:** subject, body (with `{{variables}}`), variable list, active/inactive, **test send**.

**Recipients (`email_recipients`):** name, email, type, active, notes.

**Secrets:** provider API key lives only in Edge Function env / server — never in frontend or repo.

---

## 9. SEO Management Strategy

**Per page (`seo_pages`):** SEO title, meta description, keywords, OG title/description/image, canonical URL, schema type, image alt text, local SEO fields.

**Pages:** Home, About, Booking, Rewards, RC Machines, Menu, Gallery, Contact (Blog/location pages future).

**Local SEO targets:** Auckland; New Zealand; kids activities Auckland; family activities Auckland; birthday party venue Auckland; indoor activities Auckland; team building Auckland.

**Frontend mechanism:** a `<Seo>` component (e.g. react-helmet-async) reads `seo_pages` per route and injects meta/OG/JSON-LD. Until CMS is live, defaults stay hardcoded; admin overrides take precedence when present.

---

## 10. Development Phase Roadmap

| Phase | Scope | Risk | Files likely to change | Testing checklist |
|-------|-------|------|------------------------|-------------------|
| **1. Admin UI demo** | Build `/admin/*` shell, sidebar, dashboard, tables with mock data. No DB writes. | Low | new `src/admin/*`, `App.jsx` routes | routes render; no public-site regression; build passes |
| **2. Auth + roles** | Supabase Auth login/logout/reset; `profiles`,`admin_roles`; route + RLS guards | Medium | `src/services/auth*`, guards, RLS policies | login/logout; role gating; unauthorized blocked; RLS denies anon |
| **3. Reward backend live** | `reward_*` tables + RPCs; staff scanner; admin card mgmt; flag-switch from demo | Medium | reward services, reward pages, RPCs | stamp add; duplicate-day block; unlock@7; redeem reset; token read; demo fallback |
| **4. CMS/media/packages/menu** | `website_*`,`media_library`,`packages`,`food/drink`,`gallery`,`videos`,`machines`,`testimonials`; Storage; live-read on frontend | Medium-High | many `src/data/*` → services, public pages | content edit reflects live; image upload; active/sort; cache invalidation; no layout break |
| **5. Booking mirror/sync** | Read bookings into admin (mirror table or read endpoint); no write cutover | Medium | sync Edge Function, booking admin | parity vs Sheet; filters/search; export CSV; **live booking unaffected** |
| **6. Full booking migration** | Supabase becomes booking source; offline bookings; status history | High | `bookingConfig.js`, `Booking.jsx`, RPCs | online Mon–Fri rule; offline weekend/events; status transitions; emails still send; rollback path |
| **7. Email + analytics** | Edge Function email + templates; dashboard analytics/views | Medium | email fn, templates admin, dashboard | test send each template; recipients respected; KPIs correct |

---

## 11. Risk Areas

- **Booking continuity (highest):** any change to `bookingConfig.js`/`Booking.jsx`/Apps Script can break live revenue flow. Mitigate with mirror→dual-write→cutover + rollback.
- **CMS migration breakage:** moving static `src/data/*` to DB can cause empty/broken sections. Mitigate with per-page flags + seed-from-existing + fallbacks.
- **RLS misconfiguration:** a wrong policy could leak customer data (emails/phones). Mitigate with default-deny + explicit tests for anon access.
- **Service role exposure:** must never reach the browser/repo. Mitigate with Edge Function isolation + CI grep check.
- **Media/video storage cost & size:** large videos in Storage are heavy. Mitigate with external links/Instagram for big videos.
- **Reward fraud:** self-stamping or duplicate stamps. Mitigate with staff-auth RPCs + secure tokens + same-day block + audit log.
- **Bundle bloat:** admin code shipped to public users. Mitigate with route-level code splitting or a separate admin build.

---

## 12. What Should Be Built First

1. **Phase 1 admin shell** (UI demo, mock data) — zero risk, validates UX with the owner.
2. **Phase 2 Auth + roles** — foundation everything else depends on.
3. **Phase 3 Reward backend** — highest business value, isolated from booking, demo already proves the UX.

Defer CMS (4), booking sync (5/6), and email/analytics (7) until the above are stable and approved.

---

## 13. What Should NOT Be Touched Yet

- `src/data/bookingConfig.js` and `src/pages/Booking.jsx` (live booking logic).
- The Google Apps Script project + Google Sheet (external booking backend + emails).
- `public/.htaccess` (SPA routing / deep links).
- `src/data/rewardsDemo.js` and reward pages (keep demo working until Phase 3 flag flip).
- Static content files (`src/data/menu.js`, `machines.js`, `gallery.js`, `videos.js`, `site.js`) until Phase 4 CMS seeding.
- No tables, RLS, or RPCs created until the relevant phase is approved.

---

## Approval Gate

Awaiting your approval. On approval, recommended start = **Phase 1 (admin UI demo, no DB writes)**. No implementation code, tables, or booking changes will be made before then.
