# Pantry List

Smart household shopping list — track stock at home, auto-generate a shopping list when items run low. Works on any phone via the browser (PWA).

## Features

- **Shared home** — one invite link, syncs between two phones in realtime
- **Categories** — Groceries, Hygiene, Cleaning (editable)
- **Stock tracking** — set target quantity (e.g. always 3 milk), tap − when you use one
- **Auto shopping list** — items below target appear on the Shopping tab
- **PWA** — add to home screen on iPhone/Android for app-like experience

## Setup

### 1. Supabase (free)

1. Create a project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** and run the contents of `supabase/schema.sql`
3. Go to **Project Settings → API** and copy:
   - Project URL
   - `anon` public key

### 2. Environment

```bash
cp .env.example .env
```

Edit `.env`:

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 3. Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173 on your phone (same Wi‑Fi) or deploy to Vercel/Netlify.

### 4. Use on two phones

1. **Phone 1:** Create home → Settings → Copy link
2. **Phone 2:** Open the link → Join home
3. Both see the same inventory and shopping list, synced live

## Deploy

```bash
npm run build
```

Deploy the `dist` folder to [Vercel](https://vercel.com) or [Netlify](https://netlify.com). Add the same env vars in the dashboard.

## Tech stack

- React + TypeScript + Vite
- Tailwind CSS
- Supabase (PostgreSQL + Realtime)
- PWA via vite-plugin-pwa
