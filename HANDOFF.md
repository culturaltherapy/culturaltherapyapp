# Cultural Therapy / B.L.E.S.S — Claude Code Handoff

This document is the complete spec for taking the prototype in this project
and turning it into a **production mobile-first web app** with a path to
**native iOS + Android apps**. Read it top-to-bottom before writing code.

---

## 0. What this project is

**Cultural Therapy** is the consumer brand. **B.L.E.S.S** (Building Lived
Experience Support Systems) is the internal/community name for the lived
experience network that lives inside the app.

The app is three products under one roof:

1. **Lived Experience Network** — Hinge-style discovery of people who share
   your cultural and lived-experience context. You connect, build a Tribe,
   and host conversations in your Village.
2. **Peer Support Academy** — accredited course delivery so members can train
   to become peer supporters.
3. **Discussions** — public forums and live chatrooms by topic.

Plus a **Crisis & Safeguarding** layer that runs across all three.

The audience is global, with strong African / Caribbean / diaspora roots.
Tone is **warm primary, activist where appropriate**.

---

## 1. The prototype as it stands

### 1.1 Stack
- Static `index.html` loads React 18.3.1 + ReactDOM via UMD.
- `<script type="text/babel">` for in-browser JSX (Babel standalone).
- No bundler, no TypeScript, no router. State lives in React.
- Fonts: DM Serif Display, Inter Tight, JetBrains Mono (Google Fonts).
- Design tokens in `src/tokens.css` (CSS custom properties).
- Tweaks panel (`src/tweaks-panel.jsx`) for in-design knobs (palette, motif
  density, grid layout, tone, dark mode, logged-in/-out).

> 🚨 **This stack is for design fidelity only.** Migrate before shipping —
> see §3.

### 1.2 File map

| File | Purpose | Keep / port |
|---|---|---|
| `index.html` | Script tag list (load order matters) | Replace with bundler entry |
| `src/tokens.css` | Palette + type + radii + shadow CSS variables | **Keep** — copy into the new app's global stylesheet |
| `src/motifs.jsx` | Adinkra (Sankofa, Dwennimmen, Funtunfunefu), Kemetic (Eye, Pyramid, Ankh), Bantu (Ubuntu) as inline SVG components | **Keep** — port as-is |
| `src/data.jsx` | All mock data (people, prompts, tribes, posts, courses, discussions) | **Replace** with API calls |
| `src/components.jsx` | Shared UI: `Avatar`, `Button`, `Chip`, `Icon`, `Modal`, `CrisisBanner`, top header | **Keep** — port to TS |
| `src/tweaks-panel.jsx` | Design-tweaks panel | **Drop** in production build (dev-only) |
| `src/landing.jsx` | Marketing landing page | Keep, but render server-side / static |
| `src/onboarding.jsx` | 11-step onboarding (Hinge-style, mandatory enforcement, ID step, code-of-conduct walkthrough) | **Keep** logic; rewire to API |
| `src/home.jsx` | Member dashboard | Keep |
| `src/academy.jsx` | Peer Support Academy — modules, lessons, progress | Keep UI; rewire content + progress to API |
| `src/network.jsx` | Discovery grid — cards / list / mosaic, filters, search | Keep; rewire to API + indexed search |
| `src/surfaces.jsx` | Tribe (multi-tribe list), Village (per-tribe threads + audio room shell), Discussions (forum + chat), Moderation queue | Keep UI; rewire to API + WebRTC + WebSocket |
| `src/wall.jsx` | Posts on a profile (compose, edit, delete, like, comment, per-post visibility) | Keep UI; rewire to API |
| `src/profile.jsx` | Profile editor (sectioned typeform-style) **and** public profile view (`me` route) | Keep UI; rewire to API |
| `src/app.jsx` | Top-level router (state-based: `landing | onboarding | home | academy | network | tribe | village | discussions | profile | me | moderation`) + crisis banner + tweaks-panel mount | **Replace** state-based router with React Router (or Next.js App Router) |

### 1.3 Routes implemented in the prototype
| Prototype route key | Production path | Surface |
|---|---|---|
| `landing` | `/` | Marketing landing |
| `onboarding` | `/onboarding` | 11-step onboarding |
| `home` | `/home` | Member dashboard |
| `academy` | `/academy` | Peer Support Academy |
| `network` | `/network` | Lived experience grid |
| `tribe` | `/tribes` | All my tribes |
| `village` | `/tribes/:id` | Single Village |
| `discussions` | `/discussions` | Public forum + chatroom |
| `profile` | `/profile/edit` | My profile editor |
| `me` | `/profile` | My public profile (avatar tap → here) |
| `moderation` | `/admin/moderation` | Mod queue (gated) |

---

## 2. Mobile-first is non-negotiable

This is a **mobile web app** that must also ship as a **native app**.
Optimize the codebase for that order: mobile web first, desktop responsive
second, native shells third (sharing the same React code).

### 2.1 Mobile web app — required behaviors
- **Viewport meta** is already set in `index.html`. Add `viewport-fit=cover`
  for iOS notch handling, and respect `env(safe-area-inset-*)` in the
  bottom nav and any sticky element.
- **Touch targets ≥ 44 × 44 px**. The prototype's `Chip`, `Button`, and
  bottom-nav items hit this — keep it that way.
- **Bottom navigation** on mobile, side rail on desktop. Implement with a
  `useMediaQuery('(min-width: 1024px)')` hook in the shell component and
  swap layouts.
- **No hover-only interactions.** Every hover state must have a tap-equivalent.
- **Scroll**: vertical only on every screen except media galleries (which can
  swipe horizontally). No horizontal page scroll, no scroll hijacking.
- **Modals are full-screen sheets on mobile.** The prototype's `Modal` is
  centred on desktop — port it to a bottom sheet at < 768 px.
- **Forms**: one question per screen on mobile (the onboarding pattern). No
  multi-column forms. Inputs must declare correct `inputMode`, `autoComplete`,
  `enterKeyHint`.
- **Image upload**: use `<input type="file" accept="image/*,video/*" capture="user">`
  on the profile avatar to invoke the device camera directly.
- **Offline-tolerant**: a service worker should cache the shell + last-seen
  data so re-opening the app shows *something*. Posts compose offline → queue
  → flush on reconnect.
- **PWA installable**: ship `manifest.json` (icons in 192, 512, maskable),
  `theme_color`, `background_color`, `display: standalone`,
  `start_url: '/home'`.

### 2.2 Performance budgets (mobile, mid-tier Android, 4G)
- LCP ≤ 2.5 s
- CLS ≤ 0.1
- INP ≤ 200 ms
- Initial JS bundle ≤ 180 KB gzipped (route-split everything else)
- Images: AVIF or WebP, lazy-load below the fold, `srcset` for DPR

### 2.3 Native apps — recommended path

Use **Capacitor** (preferred) to wrap the same React codebase as iOS + Android
apps. Why Capacitor over React Native:
- Single codebase (web + iOS + Android) — already true today.
- Native plugins for camera, push, biometrics, deep links.
- Keep design fidelity; no bridge to maintain.

If a fully native experience is later required, migrate UI primitives to
**React Native** in a second pass. Don't do both at once.

**Capacitor plugins required for MVP native apps:**
- `@capacitor/camera` — profile avatar + gallery uploads.
- `@capacitor/push-notifications` (FCM + APNS) — DMs, Tribe requests, crisis alerts.
- `@capacitor/preferences` — local key/value (auth tokens, last route).
- `@capacitor/network` — online/offline indicator + queue flush.
- `@capacitor/share` — share a profile / discussion link.
- `@capacitor-community/safe-area` — safe-area inset CSS vars.
- `@capacitor-firebase/authentication` *or* `@capgo/capacitor-social-login` — Google / Apple sign-in.

**App store readiness:**
- iOS: privacy manifest declaring camera, photo library, microphone (audio
  rooms), notifications. App Tracking Transparency only if you actually track.
- Android: target SDK ≥ current Play Store requirement, runtime permissions
  for camera + mic + notifications.
- Both: age-rating questionnaire — this is a mental-health adjacent app with
  user-generated content. Expect 17+ rating and additional safeguarding
  scrutiny. Have your moderation policy + crisis flow documented for review.

---

## 3. Production stack — recommendation

### 3.1 Frontend
- **Next.js 15** (App Router) with React 19 + TypeScript. SSR for the
  landing page and SEO surfaces; client components for the app interior.
  Alternatively, **Vite + React Router** if SSR isn't needed.
- **Tailwind CSS** wired to `src/tokens.css` custom properties so the
  Tweaks-panel knobs continue to work in dev.
- **TanStack Query** for data fetching + cache.
- **Zustand** for cross-route UI state (modals, toasts, active tribe).
- **Capacitor** wrapper for native apps (see §2.3).

### 3.2 Backend
**Recommended: Supabase** (Postgres + Auth + Storage + Realtime + Edge
Functions). It covers 80% of MVP without ops work. Tradeoff: vendor lock-in.

Alternative: **Node (Fastify) + Postgres + S3 + Pusher + Auth0**. More
flexible, more to operate.

### 3.3 Realtime
- **Text chat / Discussions / Village threads** — Supabase Realtime *or*
  Pusher.
- **Audio rooms (Village)** — **LiveKit** (open source, self-host or cloud).
  Recommended over 100ms / Daily for cost + control.
- **Push notifications** — Firebase Cloud Messaging (Android + web) +
  APNS (iOS) bridged via FCM.

### 3.4 Identity verification
- **Persona** or **Stripe Identity**. Real ID + selfie stored by the
  vendor, not on our servers. We store only `profile.id_verified: boolean`
  and the vendor's reference ID.

### 3.5 Search
- v1: Postgres full-text + a weighted `score()` function (location proximity
  primary, lived-experience overlap secondary).
- v2: Typesense or Meilisearch when the index gets too slow.

---

## 4. Data model (Postgres)

```sql
-- USERS & PROFILES
profiles (
  id uuid pk,
  alias text not null,            -- shown to others
  full_name text,                 -- NEVER returned to other users
  avatar_url text,
  bio text,
  pronouns text,
  city text,
  country text,
  lat double precision,           -- coarse, rounded to 0.1°
  lng double precision,
  descent text[],                 -- e.g. ['Jamaican','British']
  languages text[],
  diagnosis text,                 -- self-described, optional
  diagnosis_visibility visibility default 'private',
  experience_tags text[],         -- 'lived through' tags
  id_verified boolean default false,
  id_vendor_ref text,
  wall_enabled boolean default true,
  accepts_tribe_requests boolean default true,
  accepts_dms boolean default true,
  accepts_calls boolean default false,
  accepts_video boolean default false,
  created_at timestamptz default now()
);

-- enum
visibility := ('public' | 'tribe' | 'village' | 'private')

profile_prompts (
  id uuid pk,
  user_id uuid fk profiles,
  prompt_id text not null,        -- key into prompts library
  answer text not null,
  visibility visibility default 'tribe'
);

profile_socials (
  user_id uuid fk profiles,
  platform text,                  -- 'facebook'|'twitter'|'instagram'|'snap'|'linkedin'
  handle text,
  primary key (user_id, platform)
);

-- TRIBES & VILLAGES
tribes (
  id uuid pk,
  name text not null,
  blurb text,
  color text,                     -- hex from palette
  motif text,                     -- 'sankofa'|'kemetic'|'ubuntu'|'dwennimmen'|...
  owner_id uuid fk profiles,
  created_at timestamptz default now()
);

tribe_members (
  tribe_id uuid fk tribes,
  user_id uuid fk profiles,
  role text default 'member',     -- owner | mod | member
  joined_at timestamptz default now(),
  primary key (tribe_id, user_id)
);

tribe_requests (
  id uuid pk,
  tribe_id uuid fk tribes,
  requester_id uuid fk profiles,
  message text,
  status text default 'pending',  -- pending | accepted | declined
  created_at timestamptz default now()
);

village_threads (
  id uuid pk,
  tribe_id uuid fk tribes,
  author_id uuid fk profiles,
  title text not null,
  body text,
  created_at timestamptz default now()
);

village_messages (
  id uuid pk,
  thread_id uuid fk village_threads,
  author_id uuid fk profiles,
  body text not null,
  created_at timestamptz default now()
);

audio_rooms (
  id uuid pk,
  tribe_id uuid fk tribes,
  title text,
  host_id uuid fk profiles,
  scheduled_at timestamptz,
  is_live boolean default false,
  allow_recording boolean default false,
  livekit_room_name text
);

-- POSTS (the wall)
posts (
  id uuid pk,
  owner_id uuid fk profiles,
  body text,
  visibility visibility,
  village_id uuid fk tribes null, -- when visibility='village'
  created_at timestamptz default now(),
  edited_at timestamptz
);

post_media (
  post_id uuid fk posts,
  media_id uuid fk media,
  ordinal int,
  primary key (post_id, media_id)
);

post_comments (
  id uuid pk,
  post_id uuid fk posts,
  author_id uuid fk profiles,
  body text not null,
  created_at timestamptz default now()
);

post_likes (
  post_id uuid fk posts,
  user_id uuid fk profiles,
  primary key (post_id, user_id)
);

-- MEDIA
media (
  id uuid pk,
  owner_id uuid fk profiles,
  kind text,                      -- 'image' | 'video'
  url text,
  thumb_url text,
  caption text not null,          -- mandatory by product rule
  duration_s int,                 -- for video
  width int, height int,
  created_at timestamptz default now()
);

-- DISCUSSIONS & CHAT (public)
discussion_rooms (
  id uuid pk,
  title text,
  blurb text,
  motif text,
  is_chat boolean default false   -- true = realtime chatroom, false = forum
);

discussion_posts (
  id uuid pk,
  room_id uuid fk discussion_rooms,
  author_id uuid fk profiles,
  body text,
  created_at timestamptz default now()
);

-- ACADEMY
courses (id uuid pk, title text, blurb text, motif text);
modules (id uuid pk, course_id uuid fk courses, title text, ordinal int);
lessons (id uuid pk, module_id uuid fk modules, title text, body_md text, video_url text, ordinal int);
lesson_progress (
  user_id uuid fk profiles,
  lesson_id uuid fk lessons,
  completed_at timestamptz,
  primary key (user_id, lesson_id)
);
enrollments (
  user_id uuid fk profiles,
  course_id uuid fk courses,
  enrolled_at timestamptz default now(),
  primary key (user_id, course_id)
);

-- MODERATION & SAFEGUARDING
mod_reports (
  id uuid pk,
  reporter_id uuid fk profiles,
  target_kind text,               -- 'profile'|'post'|'comment'|'message'|'thread'
  target_id uuid not null,
  reason text,                    -- enum: 'safety' | 'abuse' | 'spam' | 'crisis' | 'other'
  severity text default 'normal', -- normal | high | crisis
  status text default 'open',     -- open | triaged | actioned | dismissed
  notes text,
  created_at timestamptz default now()
);

crisis_resources (
  id uuid pk,
  country_code text,
  name text,
  phone text,
  url text,
  hours text
);

-- AUDIT
audit_log (
  id uuid pk,
  actor_id uuid fk profiles,
  action text,
  target_kind text,
  target_id uuid,
  meta jsonb,
  at timestamptz default now()
);
```

### 4.1 Row-level security (Supabase / Postgres)
Visibility is enforced **on the server**, never the client.

- `posts` SELECT policy:
  - public → any authenticated user
  - tribe  → exists in `tribe_members` for any tribe co-membership with `owner_id`
  - village → `tribe_members` for `village_id`
  - private → only `owner_id`
- `profile_prompts` SELECT policy: same logic against `visibility`.
- `village_*` SELECT/INSERT: only `tribe_members` of the parent tribe.
- `mod_reports`: only mods/admins SELECT; anyone INSERT.

---

## 5. Endpoints (REST sketch — adjust if you go GraphQL or Supabase RPC)

```
POST   /api/auth/signup
POST   /api/auth/signin
POST   /api/auth/oauth/:provider
POST   /api/auth/verify-id           → kicks off Persona flow

GET    /api/profile/me
PATCH  /api/profile/me
GET    /api/profile/:id              → respects visibility
GET    /api/profile/:id/posts        → paginated, visibility-filtered
GET    /api/profile/:id/gallery
PATCH  /api/profile/gallery/order

POST   /api/media/upload             → multipart, returns {id, url, thumb_url}
DELETE /api/media/:id

GET    /api/network                  → grid; ?sort=mix|location|match&filters=...
GET    /api/network/search?q=...

GET    /api/tribes                   → my tribes
POST   /api/tribes                   → create tribe
GET    /api/tribes/:id               → village (members, threads, audio rooms)
POST   /api/tribes/:id/requests
PATCH  /api/tribes/:id/requests/:rid → accept | decline
GET    /api/tribes/:id/threads
POST   /api/tribes/:id/threads
GET    /api/tribes/:id/threads/:tid
POST   /api/tribes/:id/threads/:tid/messages

GET    /api/audio-rooms/:id/token    → LiveKit JWT for join

GET    /api/discussions              → list rooms
GET    /api/discussions/:id          → posts + (if chat) WS endpoint
POST   /api/discussions/:id/posts

POST   /api/posts                    → wall post
PATCH  /api/posts/:id
DELETE /api/posts/:id
POST   /api/posts/:id/like
POST   /api/posts/:id/comments

GET    /api/academy/courses
GET    /api/academy/courses/:id
POST   /api/academy/courses/:id/enroll
POST   /api/academy/lessons/:id/complete

POST   /api/reports                  → safeguarding report
GET    /api/admin/reports            → mod-only
PATCH  /api/admin/reports/:id

GET    /api/crisis-resources?country=GB
```

---

## 6. The crisis & safeguarding spec (do not skip)

This is a mental-health adjacent platform. Treat the safeguarding flow as
a P0 feature, not a phase 2 add-on.

### 6.1 The persistent banner
Implemented in `src/components.jsx → CrisisBanner`. Visible on every
authenticated screen. Tapping opens `CrisisModal` with country-keyed
resources. Country derives from profile, with a manual override.

### 6.2 Detection
On any compose surface (post, comment, DM, village thread) run a
client-side regex / phrase-list check before submit. On match, show a
non-blocking dialog:
- "It sounds like you might be in distress. Talk to someone now? [Yes — show me] [No — keep posting]"
- Always offer the option to continue. Never silently censor.
- Log the dialog impression (anonymized) so we can tune the phrase list.

Phrase list lives in a versioned JSON file the on-call mod team can edit.

### 6.3 Reporting
Any user can report any user / post / comment / message via a long-press
or "..." menu. The report sheet asks:
- "What's happening?" (radio: safety, abuse, spam, crisis, other)
- "Anything you want us to know?" (free text)

`reason = 'crisis'` raises severity to **crisis**, which auto-pages the
on-call mod. **SLA: 15 minutes, 24/7.**

### 6.4 Mod queue
`src/surfaces.jsx → Moderation` is the UI shell. Production behavior:
- Sort by `severity desc, created_at asc`.
- Mod actions: warn user, hide content, suspend (24h / 7d / permanent),
  remove from Tribe, escalate to police/local services with audit trail.
- Every action is written to `audit_log`. Nothing happens silently.

### 6.5 Audio room safeguarding
The crisis-flag button is visible inside the LiveKit audio UI. When
flagged, an off-call mod joins the room **as a silent listener** and is
able to mute speakers or end the room. Document this in the code of
conduct walkthrough — users must know mods can join.

---

## 7. Privacy & visibility — the rules

Three visibility levels: **public**, **tribe**, **private**. Some surfaces
add a fourth: **village** (only that one tribe).

| Field / surface | Default | User can override? |
|---|---|---|
| Alias | public | no |
| Real name | private | no — only ID vendor sees it |
| Avatar | public | no |
| Bio | public | yes |
| City | public | yes |
| Diagnosis | private | yes (per-field control) |
| Experience tags | tribe | yes |
| Light prompts | public | yes |
| Medium prompts | tribe | yes |
| Heavy prompts (sectioning, trauma) | private | yes |
| Wall posts | per-post; default tribe | yes |
| Gallery items | tribe | per-item override |
| Socials | public | yes |
| DMs / calls / video accept | DMs on, calls/video off | yes |

Server enforces every visibility check. The client filters for UX, not for
security.

---

## 8. Voice, tone, and content rules

- Hybrid voice: **warm primary, activist where appropriate**.
- Never clinical-by-default. Lead with "lived experience"; "diagnosis" is
  optional and self-described.
- "Tribe" — never "friends" or "connections".
- "Village" — the space inside one Tribe (threads + audio room).
- Code of conduct is **walked through** during onboarding (six clauses,
  each must be visited before "I accept" enables). Stored in `audit_log`.
- AI-generated content is **not allowed** in posts, comments, profile
  prompts, or course material. Members may use AI for accessibility
  (transcription, translation) but the platform itself does not generate
  content with an LLM.

---

## 9. Visual system

### 9.1 Tokens (`src/tokens.css`)
Palette is hot-swappable via the dev Tweaks panel. Two named palettes
ship: **Earth** (default) and **Indigo Dusk**. Add more by extending the
`[data-palette="..."]` blocks.

### 9.2 Type
- DM Serif Display — display, italic accents
- Inter Tight — UI body
- JetBrains Mono — eyebrows, metadata, monospace decoration

### 9.3 Motifs
Three traditions, used **one per surface** so they never collage:
- **Adinkra** — Sankofa (network), Dwennimmen (academy), Funtunfunefu (discussions)
- **Kemetic** — Eye of Horus (profile), Pyramid (home), Ankh (crisis)
- **Bantu** — Ubuntu (tribes / village)

Density is a tweakable knob (`none | subtle | prominent`). Default
**subtle**. "None" must still feel grounded — don't reveal a generic
SaaS underneath.

### 9.4 Imagery
No stock photography of people-in-distress. Use illustration, abstract
texture, or member-contributed imagery only. All member uploads require
captions (accessibility + safeguarding).

---

## 10. What is intentionally OUT of MVP

- Therapist marketplace + booking (phase 2).
- Payments (course fees, donations) — phase 2.
- Translation of UI strings (English only at launch; design strings to be
  i18n-ready: no concatenation, use ICU MessageFormat).
- Group video calls (audio rooms only at launch).
- AI assistance features.

---

## 11. Build order

A pragmatic 8-week schedule for one full-stack engineer + one designer:

1. **Week 1** — Stack setup. Next.js + Supabase project. Tokens + components ported. Auth (email + Google + Apple). PWA manifest.
2. **Week 2** — Onboarding flow + ID verification (Persona sandbox). Profile editor. Code of conduct walkthrough.
3. **Week 3** — Profile public view (`/profile/:id`). Wall posts with visibility. Media upload (Storage + transcoder + captions).
4. **Week 4** — Network grid + search + filters. Tribe requests.
5. **Week 5** — Tribes + Village threads (Realtime). Multi-tribe model.
6. **Week 6** — Audio rooms (LiveKit integration, host/speaker/listener roles, recording opt-in, mod silent-join).
7. **Week 7** — Discussions (forum + chat). Academy (course delivery, lesson progress).
8. **Week 8** — Crisis flow end-to-end. Moderation queue. Push notifications. Capacitor wrap → TestFlight + Play internal track.

---

## 12. Definition of done (MVP)

- All 11 routes work end-to-end with real data on mobile Safari + Chrome Android.
- ID verification gates posting publicly.
- Crisis banner is on every authenticated route.
- Reports route to on-call mod with paging.
- All visibility rules enforced server-side and tested.
- Lighthouse mobile score ≥ 90 / 95 / 90 / 100 (perf / a11y / best / SEO).
- Capacitor builds run on iOS simulator and Android emulator with camera + push.
- App store privacy manifests filled in; age rating questionnaire complete.
- Audit log writes for every moderation action.

---

## 13. Things I'd push back on if I were the engineer

If during build any of the below are still in spec, ask product before coding:

1. **Diagnosis as a profile field** even with privacy controls — pathologisation risk. Prefer "what I've lived through" tags as the primary, with diagnosis as an opt-in private secondary.
2. **Public location** at city resolution — fine for big cities, doxxing risk for small towns. Show country always, city only with an opt-in toggle that warns.
3. **Recording audio rooms** by default — even with opt-in, archived voice of vulnerable members is a long-term liability. Default off; add a strong consent flow with an automatic 90-day delete.
4. **Open registration** without invite — easy abuse vector for a peer-support network. Consider invite-tree or vouching for the first 12 months.
5. **One mod team** for global 24/7 coverage. Either contract a managed trust-and-safety partner (e.g. Cinder, Discord T&S vendors) or staff regionally. Don't volunteer-mod a mental-health platform.

---

## 14. Files to share with Claude Code

When opening a session with Claude Code, share:
- This `HANDOFF.md`.
- The whole `src/` directory (motifs, tokens, components, surfaces) — it's
  the source of truth for visual design.
- The original product brief (`uploads/Cultural therapy app (4).docx`).
- Any new content the founder writes for the Academy curriculum.

Open this project as the **design reference** alongside the new codebase
so you can compare pixel-for-pixel as you port screens.
