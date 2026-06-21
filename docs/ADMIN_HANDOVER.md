# RCC Cafe — Admin Panel Handover Guide

A non-technical guide for managing the Remote Control Cafe website from the admin panel.

---

## 1. First-time database setup (run once)

Run these three SQL files in the Supabase **SQL Editor**, in order:

1. `supabase/rcc-admin-backend.sql` — creates all tables, security rules, functions, base packages, reward settings and the media bucket.
2. `supabase/cms-seed.sql` — fills the editable website text (Home + Experience + Footer).
3. `supabase/menu-seed.sql` — fills the cafe menu (drinks + food) so the Menu module has rows to edit.

> If the admin panel shows **empty** Menu or Content pages, it means step 2 and/or step 3 were not run yet.

### Make yourself Super Admin

After creating your login under **Authentication > Users**, copy your user UUID and run:

```sql
insert into public.profiles (id, full_name, email, role, active)
values ('YOUR_AUTH_USER_UUID', 'Your Name', 'you@email.com', 'super_admin', true)
on conflict (id) do update set role = 'super_admin', active = true;
```

> If the admin panel shows **"data unavailable"** or pages stay blank after login, your profile role is missing. Run the command above, then log out and log back in.

---

## 2. Logging in

- Go to `your-site.com/admin/login`
- Enter your email and password
- You land on the **Dashboard**

To log out, use the menu in the sidebar.

---

## 3. Dashboard

The dashboard shows quick stats and recent activity (bookings, reward cards, leads). Use the quick actions to jump to common tasks.

---

## 4. Editing website content (Home & Experience)

Go to **Content**.

- Each row is a website section (e.g. Home → Hero, Home → Intro, Experience → Hero).
- Click **Edit** to change the **title**, **subtitle**, image/video URL, or the **Content JSON** (the body text).
- The `content` field is JSON. To change body text, edit the value after `"body":` and keep the quotes, e.g. `{"body":"Your new text here"}`.
- Toggle **Active** off to hide a section (the site then uses its built-in default text).
- Save. Refresh the public website to see the change.

---

## 5. Editing the Menu

Go to **Menu**.

- **Add New** to create an item (name, category, price, description, image, availability, featured).
- **Edit** any item to change price, description, image or category.
- Untick **Available** to hide an item from the public Menu.
- Tick **Featured** to highlight it.
- `Sort Order` controls the display order within a category.

---

## 6. Editing Packages

Go to **Packages**.

- Add / edit / deactivate booking packages (MINI / POWER / MASTER).
- Control price, duration, inclusions, popular badge, image and sort order.

> Important: keep the slugs `mini`, `power`, `master` unchanged. The Booking page price calculation relies on them. You can freely change names, prices, descriptions and images.

---

## 7. Managing Bookings

Go to **Bookings**.

- View online + offline bookings.
- Update **status** (new, pending, confirmed, completed, cancelled, no_show).
- Toggle **Food Prepared** when the kitchen is ready.
- Add **Admin Notes**.
- **Add New** to enter an offline/phone booking manually.

---

## 8. Reward cards & scanner

### Customers (public)
- Customer opens `/rewards`, fills name, mobile, email, DOB.
- A reward card with an `RCC####` ID and QR code is created.
- They can log back in with **RCC ID + DOB**.

### Staff/Admin
- Go to **Scanner** (`/admin/rewards/scanner`).
- Scan the QR or type the RCC ID.
- Add one or more stamps (multiple per day allowed), with an optional note.
- At 7 stamps the reward unlocks; redeem it to start a new cycle.
- Redeem the welcome gift from the same screen.

Manage all cards under **Rewards**. Create time-bound promotions under **Offers**.

---

## 9. Uploading media (images / videos)

Go to **Media**.

- **Add New**, choose a category, and upload an image or video.
- The file is stored in Supabase Storage and a public URL is saved.
- Copy that URL and paste it into a Content section, Menu item or Package image field.
- Add **Alt text** for accessibility. Deactivate to hide.

---

## 10. SEO

Go to **SEO**.

- Edit per-page meta title, description, keywords, Open Graph (social share) title/image, canonical URL and schema JSON.

---

## 11. Leads

Go to **Leads**.

- Website, venue-hire and reward enquiries land here.
- Update status (new → contacted → follow_up → converted/lost), set a follow-up date and add notes.

---

## 12. Settings

Go to **Settings** (Super Admin only).

- Business info, reward rules, email recipients and other configuration stored as JSON values.

---

## 13. Staff roles

- **super_admin** — everything, including Users and Settings.
- **admin / manager** — operations, content, menu, packages, rewards, leads.
- **staff** — Bookings and Reward Scanner only.

---

## 14. What NOT to touch

- Do not change package slugs `mini` / `power` / `master`.
- Do not delete the reward settings row.
- Do not share the Supabase **service role** key — only the public anon key is used by the website.

---

## 15. Troubleshooting

- **Menu / Content empty in admin** → run `menu-seed.sql` / `cms-seed.sql`.
- **All pages blank or "data unavailable" after login** → your profile role is not set; run the Super Admin SQL and log in again.
- **Changes not showing on the website** → refresh the public page; confirm the section/item is **Active/Available**.
- **Can't upload media** → confirm you are logged in as admin/manager and the `rcc-media` bucket exists.
- **QR camera not working** → the site must be opened over HTTPS.
