# Supabase Setup Guide

Follow these steps once in your [Supabase dashboard](https://supabase.com/dashboard) before deploying.

---

## 1. Create the database tables

Go to **SQL Editor** and run the following:

```sql
-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_name TEXT NOT NULL,
  id_image_path TEXT NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  num_days INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  pin_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'extra_admin')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 2. Disable Row Level Security (RLS)

All access goes through your server using the **service role key**, so RLS should be disabled on both tables.

Run in SQL Editor:

```sql
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;
```

---

## 3. Create the Storage bucket

1. Go to **Storage** in the Supabase sidebar.
2. Click **New bucket**.
3. Name it exactly: `id-images`
4. Set it to **Private** (not public).
5. Click **Create bucket**.

---

## 4. Get your credentials

Go to **Project Settings → API**:

- **Project URL** → `SUPABASE_URL`
- **`service_role` key** (under "Project API keys") → `SUPABASE_SERVICE_KEY`

> ⚠️ **Never expose the service role key on the client side.** It is only used server-side.

---

## 5. Set environment variables

### For local development

Create `server/.env` (copy from `server/.env.example`):

```env
PORT=5000
JWT_SECRET=a_long_random_secret_string
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPER_ADMIN_USERNAME=your_chosen_username
SUPER_ADMIN_PIN=your_initial_pin
```

### For Vercel

Go to your Vercel project → **Settings → Environment Variables** and add:

| Name | Value |
|------|-------|
| `JWT_SECRET` | A long random string |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Your service role key |
| `SUPER_ADMIN_USERNAME` | Your admin username |
| `SUPER_ADMIN_PIN` | Your initial PIN (min 6 chars) |

---

## 6. First login

On the first server startup, the super admin is automatically seeded using `SUPER_ADMIN_USERNAME` and `SUPER_ADMIN_PIN`.

Log in at `/admin/login` and **change your PIN immediately** from the Settings page.
