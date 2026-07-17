# RCC Cafe Supabase SQL Audit

Audit date: 2026-06-21

## Active SQL Files

| File | Purpose | Production | Replaced | Archive | Run order | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `rcc-admin-backend.sql` | Fresh-project base schema, core rewards/admin tables, RLS, storage bucket and base RPCs | Yes | No | No | 1 | Required on a new Supabase project. It is the prerequisite for every later migration. |
| `admin-final-access-fix.sql` | Role helpers, admin access policies, diagnostics and reward stamp correction RPC | Yes | No | No | 2 | Requires the base schema. Non-destructive and repeatable. |
| `booking-production-hardening.sql` | Creates `booking_settings`, reward event audit fields and reward undo support | Yes | No | No | 3 | Required before Booking V2/V3 migrations. |
| `booking-system-v2.sql` | Adds canonical booking capacity fields, pending booking RPC, atomic approval and realtime capacity support | Yes | Partly extended by V3 | No | 4 | Still required because V3 depends on schema introduced here. Do not archive yet. |
| `final-admin-v3.sql` | Booking V3 fields/RPCs, Rewards V2 identity, notification reads and realtime compatibility | Yes | No | No | 5 | Incremental migration, not a standalone base schema. |
| `admin-panel-v3-phase1.sql` | Current admin dashboard, booking actions, notifications and customer reward-card RPCs | Yes | No | No | 6 | Run after `final-admin-v3.sql`. |
| `public-site-settings.sql` | Public social links, opening hours, announcement settings and booking sync-status RPC | Yes | No | No | 7 | Run after Admin Phase 1. Existing settings are preserved. |
| `cms-seed.sql` | Initial editable CMS rows | Yes, first setup | No | No | 8 | Optional on an existing populated project. Re-running resets seeded CMS copy. |
| `menu-seed.sql` | Initial menu catalogue | Yes, first setup | No | No | 9 | Name-guarded; does not duplicate rows. |
| `offers-seed.sql` | Default reward offer | Yes, first setup | No | No | 10 | Inserts only when the offer is absent. |
| `seo-seed.sql` | Initial managed SEO records | Yes, first setup | No | No | 11 | Re-running updates seeded SEO defaults. |
| `settings-seed.sql` | Initial business/admin settings | Yes, first setup | No | No | 12 | Re-running resets seeded setting values. |

## Archived SQL Files

| File | Purpose | Production | Replaced | Safe to archive | Notes |
| --- | --- | --- | --- | --- | --- |
| `_archive/old-sql/booking-v3-fixed-hour-slots.sql` | One-off fixed-hour setting patch | No | Yes | Yes | Its active values are represented by the current V3 booking settings and admin controls. |
| `_archive/old-sql/rcc-booking-rules-update.sql` | One-off MINI/POWER/MASTER package state patch | No | Yes | Yes | The base seed already marks MINI inactive; current Booking V3 does not use package rows as capacity authority. |

## Audit Findings

- No active migration contains `DROP TABLE`, `TRUNCATE`, `DROP SCHEMA` or destructive data deletion.
- Policy recreation uses `DROP POLICY IF EXISTS` followed by `CREATE POLICY`.
- Tables and extensions use idempotent creation patterns.
- Triggers are dropped before being recreated where required.
- The old package-state and fixed-slot patches were duplicate one-off updates and are no longer part of the active run chain.
- `final-admin-v3.sql` and `admin-panel-v3-phase1.sql` are incremental. They must not be presented as a complete fresh-project schema by themselves.
