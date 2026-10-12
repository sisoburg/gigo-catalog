# Gigo — jewelry catalog

A private, shareable catalog site. React + Vite + TypeScript on the frontend,
Supabase for the database/storage/auth, deployed to GitHub Pages. Hebrew +
English, RTL-aware, black-and-white editorial design.

## Status

Built and working end to end against the real Supabase project: home page,
carousel, piece detail pages, and the admin interface all load/write real
data. **Not yet done:**
- This repo hasn't been pushed to GitHub yet, so the deploy workflow hasn't
  actually run. See **Deploying** below.
- The admin interface (`/admin`) is built and type-checked but hasn't been
  exercised against a real login — I don't have (and shouldn't have) your
  admin password, so that needs a pass from you.

## Local development

```
npm install
cp .env.example .env.local   # already has the real values — see "Where the keys live"
npm run dev
```

Opens at `http://localhost:5173/gigo-catalog/`.

## Logging into admin

Go to `/admin` (redirects to `/admin/login` if you're not signed in).

- **Email:** `sisoburg@gmail.com`
- **Password:** whatever you set when you created the user in the Supabase
  dashboard (Authentication → Users). I never saw or stored it.

Forgot it? In the same dashboard page, click the user and set a new password
directly — no email flow needed since public sign-up/password-reset email is
off.

From `/admin` you can add/edit/delete pieces, drag-reorder them, toggle
draft/live, upload and crop photos (auto-resized to three sizes), upload
short videos, set each piece's cover image, and set the homepage hero.
Changes are live on the public site immediately — no redeploy.

## Deploying

Repo: https://github.com/sisoburg/gigo-catalog — `BASE_PATH` (`src/basePath.ts`)
and `public/404.html` are set to `/gigo-catalog/` to match it.

1. Push this repo to it (already on a `main` branch, matching the workflow):
   ```
   git remote add origin https://github.com/sisoburg/gigo-catalog.git
   git push -u origin main
   ```
2. In the repo's Settings → Pages, set **Source** to "GitHub Actions."
3. Push (or re-run the workflow from the Actions tab) — it builds and
   deploys automatically on every push to `main`.
4. The site will be live at `https://sisoburg.github.io/gigo-catalog/`.

Note: on a free GitHub account, Pages only serves from **public** repos
(private-repo Pages needs Pro/Team/Enterprise) — the deployed site itself is
still unlisted and `noindex`'d either way, so this only affects whether the
*source code* is publicly visible, not whether strangers can stumble onto
the catalog. If you'd rather rename the repo or make it private with a paid
plan, update `BASE_PATH` and `public/404.html` to match first.

A second workflow (`keep-alive.yml`) pings Supabase every 3 days so the free
project doesn't pause from inactivity (Supabase pauses Free-tier projects
after 7 days with no API activity) — it starts working as soon as the repo
exists on GitHub, no setup needed.

## Where the keys live

- **Supabase URL + anon/publishable key** — in `.env.local` (gitignored) for
  local dev, and in `.env.example` (committed) for the same values, since
  they're meant to be public: Row Level Security enforces what the anon key
  can actually read or write, not the key's secrecy. The deploy workflow
  copies `.env.example` to `.env.local` before building — no GitHub Secrets
  needed.
- **Supabase service role key** — never used anywhere in this repo. The
  one-time import script (`scripts/import-to-supabase.ts`) authenticates as
  the admin account instead.
- **Admin password** — only in your head / password manager, set via the
  Supabase dashboard. Not stored anywhere in this repo or in Supabase
  Auth settings I have access to.
- **Supabase project:** `gigo-catalog` (`mjmdevbdqhfwmdfebwfv`), org "Noam",
  region `eu-central-1`. Dashboard: https://supabase.com/dashboard/project/mjmdevbdqhfwmdfebwfv

## Project structure

```
src/
  pages/            Home, PieceDetail (public site)
  components/        Hero, Carousel, Gallery, BrandFilmstrip, etc.
  data/              CatalogContext (live data fetch), types, DB row mapping
  admin/             /admin — login, piece CRUD, media upload/crop, hero
  lib/               Supabase client, generated DB types, auth session hook
  i18n/              Hebrew/English strings + language context
scripts/
  import-to-supabase.ts   One-time import (already run); see its header comment
.github/workflows/
  deploy.yml          Build + deploy to Pages on push to main
  keep-alive.yml       Pings Supabase every 3 days
```

## Known limitations / possible follow-ups

- Photo crop is a single fixed 4:5 ratio sitewide (matches the brief); no
  separate focal-point UI beyond the crop itself (the DB has focal_x/focal_y
  columns, currently always centered — only worth building if a future
  layout needs the *same* photo cropped differently in different spots).
- Videos aren't transcoded/compressed client-side (no reliable in-browser
  encoder) — the admin just warns if a clip is long or heavy; trim before
  uploading for best results.
- HEIC photos (iPhone's default format) may not preview/crop correctly in
  non-Safari browsers — switch your phone's camera format to "Most
  Compatible" (JPEG) in Settings → Camera → Formats if you hit this.
- Main JS bundle is ~170KB gzipped (React + GSAP + Lenis + Supabase client).
  Reasonable for the amount of motion on the site, but could be trimmed
  further with route-level code-splitting if it ever matters.
