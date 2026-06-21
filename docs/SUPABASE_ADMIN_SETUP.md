# RCC Cafe Supabase Admin Setup

## 1. Install the database

1. Open the RCC Cafe project in Supabase.
2. Open **SQL Editor**.
3. Paste and run `supabase/rcc-admin-backend.sql`.
4. Confirm the tables, RPC functions and the public `rcc-media` Storage bucket were created.

This is a complete fresh-project migration. If an earlier failed migration already created incompatible reward tables, reset that development database or remove those partial objects before running this file.

## 2. Create the first Super Admin

1. Open **Authentication > Users > Add user**.
2. Create the owner account with an email and strong temporary password.
3. Copy the new user's UUID.
4. Run:

```sql
insert into public.profiles (id, full_name, email, role, active)
values ('AUTH_USER_ID_HERE', 'Kunal / Admin', 'EMAIL_HERE', 'super_admin', true)
on conflict (id) do update
set role = 'super_admin', active = true;
```

The profile row is created automatically by the Auth trigger.

## 3. Add managers or staff

Create each person in Supabase Auth, copy their UUID, then assign:

```sql
update public.profiles
set role = 'manager', active = true
where id = 'AUTH_USER_UUID_HERE';
```

Available roles:

- `super_admin`: all modules and user management
- `admin` / `manager`: operations, content and customer modules
- `staff`: bookings and reward scanner only

## 4. Frontend environment

Local development uses `.env.local`. Hostinger must build the project with:

```text
VITE_SUPABASE_URL=https://alnysrqzpfzlzjdcrgei.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
```

Never place the service-role key in Vite, browser code or Hostinger public files.

Customer reward login compares the submitted RCC Card ID and `date_of_birth` inside a protected RPC. No password hash helper or service-role key is used by the browser.

## 5. Booking mirror

The existing Google Apps Script booking submission remains unchanged.
`bookings_mirror` is an admin-side operational table and does not block the public booking flow.

To automate mirroring later, update Apps Script after a successful Sheet write or use a secure server-side integration. Do not expose a service-role key in Apps Script shared client code.

## 6. Admin URLs

- `/admin/login`
- `/admin/dashboard`
- `/admin/bookings`
- `/admin/rewards/scanner`

The remaining modules are available through the role-aware sidebar.

## 7. Production checks

- Use HTTPS for camera QR scanning.
- Test each role with a separate Auth user.
- Confirm RLS is enabled before adding production customer data.
- Configure Supabase Auth email templates and SMTP when production email workflows are enabled.
