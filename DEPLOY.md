# Deploy Pantry List (so both phones can use it from anywhere)

This gets your app online at a permanent web address (like
`https://pantry-list.vercel.app`). Once it's live, you and your partner just
open that link on any phone, on any Wi-Fi or mobile data. **Your laptop can be
turned off.** Hosting is free.

Everything on your side is already prepared. You only need to make a couple of
free accounts and click a few buttons.

---

## RECOMMENDED PATH — GitHub + Vercel (easiest, auto-updates)

With this path, your code lives on GitHub, and Vercel automatically rebuilds the
site whenever you change anything. Do this once.

### Step 1 — Make a free GitHub account
1. Go to https://github.com and click **Sign up**.
2. Follow the prompts (email, password, username). It's free.

### Step 2 — Create an empty repository
1. Once logged in, click the **+** in the top-right corner → **New repository**.
2. Name it, for example, `pantry-list`.
3. Leave everything else as-is (don't add a README or .gitignore — you already
   have one).
4. Click **Create repository**.
5. Keep that page open — you'll need the web address it shows you (it looks like
   `https://github.com/YOUR-USERNAME/pantry-list.git`).

### Step 3 — Send your project up to GitHub
Open **PowerShell** in your project folder (`D:\codes\shopping_app`) and paste
these commands one block at a time. Replace the URL in the `remote add` line
with YOUR repository address from Step 2.

```powershell
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/pantry-list.git
git push -u origin main
```

> Your secret keys are safe: the `.env` file (which holds your Supabase keys) is
> ignored by git and will NOT be uploaded. That's intentional and correct.

### Step 4 — Connect Vercel
1. Go to https://vercel.com and click **Sign Up**.
2. Choose **Continue with GitHub** and approve access.
3. Click **Add New… → Project**.
4. Find your `pantry-list` repository in the list and click **Import**.

### Step 5 — Let Vercel detect the settings (don't change them)
Vercel automatically recognizes this is a Vite app and fills in:
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

Leave all of those as-is.

### Step 6 — Add your Supabase keys (IMPORTANT — don't skip)
Still on the import screen, open the **Environment Variables** section and add
these two. Get the values by opening your local `.env` file
(`D:\codes\shopping_app\.env`) and copying them exactly:

| Name | Value (copy from your .env file) |
|------|-----------------------------------|
| `VITE_SUPABASE_URL` | the line after `VITE_SUPABASE_URL=` |
| `VITE_SUPABASE_ANON_KEY` | the line after `VITE_SUPABASE_ANON_KEY=` |

> If you skip this, the deployed app will just say **"Setup required."**

### Step 7 — Deploy
Click **Deploy** and wait about a minute. Vercel gives you a public link like
`https://pantry-list.vercel.app`. Open it — that's your live app! 🎉

---

## ALTERNATIVE PATH — Vercel CLI (no GitHub needed)

Only use this if you'd rather not use GitHub. In PowerShell, in your project
folder:

```powershell
npm i -g vercel
vercel
```

- The first `vercel` command asks you to log in (it opens your browser) and asks
  a few setup questions — just press Enter to accept the defaults.
- Add your two environment variables (once each):

```powershell
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

  Each command asks for the value (paste from your `.env`) and which
  environments — choose **Production** (and Preview/Development if you like).
- Then publish the live version:

```powershell
vercel --prod
```

Vercel prints your public URL when it finishes.

---

## Once it's live — how it works day to day

- **Both phones:** just open the URL. Tip: open it in your phone's browser, then
  use **"Add to Home Screen"** so it behaves like a real app icon (it's a PWA).
- **Your laptop can be off.** The app runs on Vercel's servers, not your
  computer, and the data lives in Supabase.
- **Making changes later:**
  - If you used **GitHub**: save your changes, then run in PowerShell:
    ```powershell
    git add .
    git commit -m "describe your change"
    git push
    ```
    Vercel notices the push and re-deploys automatically in about a minute.
  - If you used the **CLI**: just run `vercel --prod` again.

---

## Quick reference — what's already set up for you
- `vercel.json` created so deep links like `/shopping` and `/settings` load
  correctly instead of showing a 404.
- Build command confirmed: `npm run build` (`tsc -b && vite build`), output
  folder `dist` — Vercel's Vite preset matches this automatically.
- `.gitignore` already excludes `.env` and `node_modules`, so your secrets and
  bulky files stay off GitHub.
