# RCC Cafe Admin Panel Phase 1 Pending Items

## Required Before Live Release

1. Run `supabase/final-admin-v3.sql` if it has not already been installed.
2. Run `supabase/admin-panel-v3-phase1.sql` in Supabase SQL Editor.
3. Open `/admin/diagnostics` as a Super Admin and confirm all checks pass.
4. Redeploy `google-apps-script/Code.gs` as a new Web App version from `cafemteden@gmail.com`.
5. Set `VITE_GOOGLE_SCRIPT_URL` to the deployed `/exec` URL before the production build.
6. Perform live test-record QA for approval, rejection, cancellation, stamps, undo and redemption.

## Manual Responsive QA

The browser automation connection was unavailable during this run. Check these widths manually before release:

- 1440px desktop
- 1024px tablet landscape
- 768px tablet
- 430px mobile
- 390px mobile
- 360px mobile

Verify dashboard cards, booking filters/table/cards, reward detail modal, scanner camera fallback, mobile drawer and bottom navigation. Confirm no horizontal page overflow.

## Phase 2 Work

- Dedicated visual editors for Menu, Media, Content CMS and SEO.
- Drag/drop media library and image transformations.
- Content preview/revision history and publishing workflow.
- Advanced CRM segmentation, scheduled campaigns and delivery analytics.
- Staff shift/assignment tooling and richer email retry queue.
- End-to-end browser tests in CI using a dedicated Supabase test project.

No Phase 2 placeholder has been presented as complete.
