# Trading Journal

Your own trading journal — log trades, auto-calculate P/L, review a calendar and
analytics dashboard, built around your own rules and setups.

## Features

- Email/password login (Supabase Auth) — log in from any device
- Trade entry with automatic P/L calculation (no manual math)
- Screenshot attachment per trade
- Filterable trade log
- Monthly trading calendar (daily P/L + trade count)
- Analytics: win rate, average R:R, rule-adherence rate, equity curve, P/L by setup
- Your data only — row-level security means no one else can ever see your trades

## 1. Set up Supabase (free)

1. Go to [supabase.com](https://supabase.com) and create a free account + new project.
2. Once the project is ready, go to **SQL Editor → New query**, paste the entire
   contents of `supabase/schema.sql`, and run it. This creates the `trades` table,
   security rules, and the screenshot storage bucket.
   - If the storage bucket insert errors, go to **Storage** in the sidebar and
     manually create a bucket named `trade-screenshots`, set to **public**.
3. Go to **Project Settings → API**. Copy the **Project URL** and the **anon
   public** key.

## 2. Connect the app to Supabase

Open `.env` in this project and fill in:

```
VITE_SUPABASE_URL=your-project-url-here
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 3. Run it locally

```bash
npm install
npm run dev
```

Open the local URL it prints. Sign up with your email — Supabase will send a
confirmation email by default (you can turn that off in Supabase under
**Authentication → Providers → Email → Confirm email**, if you want instant
sign-in while testing).

## 4. Deploy (free, so you can log in from anywhere)

1. Push this project to a GitHub repo.
2. Go to [vercel.com](https://vercel.com), sign up with GitHub, and import the repo.
3. In Vercel's project settings, add the same two environment variables
   (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) under **Environment Variables**.
4. Deploy. You'll get a live URL you can open from your phone, a friend's laptop,
   anywhere.

## Calibrating P/L for your broker

The $-per-point multiplier in `src/lib/pnl.js` has sensible defaults for common
instruments (NAS100, XAUUSD, EURUSD, etc.), but brokers vary. The trade form
auto-fills a default multiplier per symbol, and you can override it per trade.
To calibrate: take a trade you already know the real $ result of, enter it, and
adjust the multiplier until the calculated P/L matches. After that, it'll default
correctly for that symbol.

## Project structure

```
src/
  lib/
    supabaseClient.js   — Supabase connection
    AuthContext.jsx     — login state, used app-wide
    pnl.js              — P/L calculation logic
  components/
    TradeForm.jsx        — log a trade
    TradeList.jsx         — filterable trade table
    Calendar.jsx          — monthly P/L calendar
    Analytics.jsx         — stats + charts
  pages/
    Login.jsx
    Dashboard.jsx
supabase/
  schema.sql            — run this in Supabase's SQL Editor
```
