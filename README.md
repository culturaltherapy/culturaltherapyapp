# Cultural Therapy

Building Lived Experience Support Systems (B.L.E.S.S) — a peer network,
peer-support academy, and discussion platform for the diaspora.

This repo is the **Next.js 15** production rebuild of the prototype described
in `HANDOFF.md`. It is mobile-first, PWA-installable, and designed to be
wrapped as a native iOS / Android app via Capacitor.

## Stack

- **Next.js 15** (App Router) + TypeScript + React
- **Tailwind CSS** wired to CSS-variable design tokens (Earth & Indigo palettes)
- **Supabase** for auth, Postgres, storage, realtime *(see `.env.local.example`)*
- **TanStack Query** for client data fetching (added when wired)
- Mock data layer (`lib/mock-data.ts`) so the app runs without a backend

## Routes

| Path | Surface |
|---|---|
| `/` | Marketing landing |
| `/signin` | Sign in / sign up / magic link / reset |
| `/onboarding` | 11-step onboarding |
| `/home` | Member dashboard |
| `/network` | Lived Experience grid |
| `/tribes` | My Tribes |
| `/tribes/[id]` | Village (per-tribe threads + audio room) |
| `/academy` | Peer Support Academy |
| `/academy/[courseId]` | Course view |
| `/discussions` | Forum + live chatroom |
| `/profile` | My public profile |
| `/profile/edit` | Profile editor |
| `/profile/[id]` | View someone else's profile |
| `/admin/moderation` | Mod queue (gated) |

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

The app runs **without Supabase credentials** using the mock data layer —
sign-in just routes to `/home`. To enable real auth + data:

1. Create a free project at [supabase.com](https://supabase.com).
2. Copy `.env.local.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Run the SQL migration from `HANDOFF.md` §4 in the Supabase SQL editor.

## Deploy

Push to GitHub, then connect on Vercel. Set the env vars above in the Vercel
dashboard. Vercel auto-detects Next.js — no other config needed.

## Project structure

```
app/                      # Next.js App Router
  (app)/                  # Authenticated route group (uses AppShell)
  signin/                 # Auth page (built from scratch)
  onboarding/             # 11-step onboarding (built from scratch)
components/
  ui/                     # Button, Chip, Avatar, Modal, Field, Icon
  layout/                 # TopNav, BottomNav, CrisisBanner, AppShell, Logo
  motifs/                 # Adinkra, Kemetic, Bantu motif SVGs
lib/
  mock-data.ts            # Replaces Supabase queries until env vars set
  supabase/               # Browser + server clients
  utils.ts                # cn(), initials(), timeAgo()
public/
  logo.png                # Cultural Therapy mark
  manifest.json           # PWA manifest
```

See `HANDOFF.md` for full product spec, schema, and 8-week build order.
