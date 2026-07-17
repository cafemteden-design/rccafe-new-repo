# RCC Cafe Project Cleanup Report

Audit date: 2026-06-21

## Active Files Kept

- Application source: `src/`
- Production assets and SPA files: `public/`
- Latest production output: `dist/`
- Active Supabase base, hardening, V3, Phase 1 and seed SQL files: `supabase/`
- Current Apps Script and deployment documentation: `google-apps-script/`
- Active build and SQL/admin validation scripts: `scripts/validate-build.js`, `scripts/validate-supabase-sql.mjs`, `scripts/test-final-admin-v3.mjs`
- Package lock, Vite, Tailwind and PostCSS configuration
- Environment template files; private environment files were not moved or exposed

## Files Archived

- `_archive/old-booking-system/`: unused package-era frontend hook
- `_archive/old-rewards-system/`: superseded standalone staff/admin reward pages and floating social component
- `_archive/old-sql/`: two superseded one-off SQL patches
- `_archive/screenshots/`: previous responsive QA captures
- `_archive/temp/old-scripts/`: old browser capture and superseded booking/rewards test scripts
- `_archive/temp/deployment-zips/`: previous Hostinger production archives
- `_archive/temp/deprecated-docs/`: outdated handover, audit and planning documents
- `_archive/temp/`: local Codex logs, unused UI helpers and temporary PDF output

Nothing was permanently deleted.

## Documentation Organized

- Current deployment and business content documents are under `docs/`.
- Current QA and admin completion reports are under `qa-reports/`.
- SQL audit and deployment order are documented in `SUPABASE_SQL_RUN_ORDER.md` and `SUPABASE_FINAL_RUN_ORDER.md`.

## SQL Result

- Required fresh-install chain: base schema, access fix, booking hardening, Booking V2 schema, Final Admin V3, Admin Phase 1, then initial seeds.
- Required existing-project upgrade: Final Admin V3 followed by Admin Phase 1, provided all prerequisites are already installed.
- Archived SQL must not be run.

## Risk Controls

- No production image or video was moved.
- No active route, booking component, reward component, admin page, Apps Script file or environment template was moved.
- `node_modules` was left in place because it is the installed local dependency tree, not deployment output.
- Git history and existing unrelated working-tree changes were not reverted.

## Validation

- Supabase SQL static validation: **PASS** (`11` active SQL files, `37` functions checked)
- Admin V3 contract QA: **PASS** (`30` checks)
- Vite production build: **PASS** (`2,079` modules transformed)
- Build asset validation: **PASS** (all referenced assets present)
- Latest `dist/` regenerated successfully on 2026-06-21

## Pending Manual Steps

1. Confirm whether the target Supabase project already has the four prerequisite migrations installed before using the short upgrade order.
2. Run the applicable sequence from `SUPABASE_FINAL_RUN_ORDER.md` in Supabase SQL Editor.
3. Verify `/admin/diagnostics` with the production Super Admin account.
4. Perform live-record booking, reward, Apps Script email and Google Sheet sync QA; static local checks do not mutate or prove those external services.
