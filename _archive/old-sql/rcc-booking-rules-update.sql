-- RCC Cafe booking package state update
-- Run once after rcc-admin-backend.sql if package data has already been seeded.

update public.packages
set active = false,
    badge = 'Currently Unavailable',
    description = 'Currently unavailable for online booking',
    updated_at = now()
where lower(slug) = 'mini' or upper(name) = 'MINI';

update public.packages
set active = true,
    updated_at = now()
where lower(slug) in ('power', 'master') or upper(name) in ('POWER', 'MASTER');
