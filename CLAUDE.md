# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A photography portfolio site for Cate (a photographer) with a companion admin area ("the studio") where she and the developer (Brandon) upload, arrange, and publish her work. Moody/quiet design: dark warm-green canvas, Cormorant Garamond display type, photos that fade in like developing prints as they scroll into view.

Two people share one small trusted user base (Cate + Brandon, both Supabase `authenticated` users) — there is no public signup, no multi-tenant concept, and no per-row ownership model. Every authenticated user has full read/write access to every table (see Architecture). Design and review with that in mind: this is intentional simplicity for a two-person team, not an oversight.

## Commands

```bash
npm install
npm run dev       # Vite dev server, usually http://localhost:5173
npm run build     # production build
npm run preview   # preview the production build locally
node scripts/seed.mjs   # one-time: uploads public/photos + creates starting collections in Supabase (needs SUPABASE_SERVICE_ROLE_KEY, refuses to run if albums already exist)
```

There is no lint, format, or test tooling configured (no ESLint/Prettier config, no test runner) — do not assume `npm test` or `npm run lint` exist.

## Demo mode vs. live mode

`src/lib/supabase.js` creates a Supabase client only if `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set; otherwise `supabase` is `null` and `DEMO` is `true`. With no `.env`, the site runs entirely off local sample data (`src/data/sample.js`, images in `public/photos`) so the design is reviewable with zero setup. `/admin` shows a setup message instead of the login form in demo mode.

Almost every data-fetching function in `src/lib/data.js`, and most components that check auth state, branch on `DEMO` near the top. When editing data flow, preserve this branch — don't assume Supabase is always present.

## Architecture

**Stack:** React 18 + Vite 5 + react-router-dom 6, Supabase (Postgres + Auth + Storage) as the only backend, `@dnd-kit` for drag-reordering, `@fontsource` for self-hosted fonts. No state management library — data is fetched per-page with `useEffect` + `useState`, no caching layer.

**Routing** (`src/App.jsx`): public routes (`/`, `/work`, `/work/:slug`, `/about`, `/contact`, `/shop`, `/journal`, `/journal/:slug`) plus `/admin/*` which mounts a separate nested router in `src/admin/Admin.jsx`. `Nav`/`Footer` are hidden on `/admin/*`; the admin area has its own chrome.

**Data layer** (`src/lib/data.js`): all Supabase reads/writes for public-facing content go through this one file (`getAlbums`, `getAlbum`, `getFeatured`, `getPosts`, `getPost`, wall-layout settings). Admin screens mostly query Supabase directly instead of going through this file. Row-level security does the visitor/owner gating — e.g. `getAlbum(slug)` fetches with no `published` filter and relies on RLS so a signed-in Cate sees her drafts while visitors only ever receive published rows.

**Photos have three derived sizes** (`sm`/`md`/`lg`, WebP), produced client-side at upload time in `src/lib/images.js` (`prepareUpload`, using `createImageBitmap` + canvas) and uploaded to the public `photos` Storage bucket. Only these resized copies ever reach storage — originals never upload. `src/components/Photo.jsx` renders `src_lg` (falling back to `src_md`) through an `IntersectionObserver` for lazy-in fade; `src_sm` is currently only used for admin thumbnails, not for responsive `srcset` on the public site (see caveats below).

**Featured collection powers the home page.** The album with slug `featured` is special-cased throughout: `Home.jsx` pulls its photos for the hero "wall," `AdminAlbums.jsx` pins it at the top of the collections list (not draggable — order there doesn't matter), and `AdminAlbum.jsx` shows an extra "home page opening" picker only when editing it. The opening layout (`anchor-right` / `anchor-left` / `row` / `one-frame` / `straight-in`) is stored in `site_settings` and consumes 0, 1, or 3 of Featured's leading *visible* photos (`openingCount()` in `data.js`); the rest flow into the "Selected" section below it.

**Per-photo visibility (`hidden`)**: a photo can be hidden without deleting it. Hidden photos are excluded from public counts and wall-slot/cover assignment, but Cate/Brandon see them ghosted in place (`.ghosted` class, "hidden" tag) so context isn't lost while editing. This logic (filtering `hidden` before taking wall slots, falling back to the next visible cover) is duplicated between `src/lib/data.js` (`shapeAlbum`) and `src/admin/AdminAlbum.jsx` (slot-badge computation) — keep both in sync if this rule changes.

**Slugs are permanent-ish**: renaming a collection writes the new slug to `album_slugs` (append-only history) before updating `albums.slug`, so old links 301-style redirect via client-side navigation in `Album.jsx` (`getAlbum` falls back to `album_slugs` lookup, then `Album.jsx` `navigate(..., { replace: true })` if the resolved slug differs from the URL).

**Feedback/collaboration system** is the most unusual part of this codebase and spans several files:
- `src/components/FeedbackLayer.jsx` — when signed in, every public page (and the studio) grows a click-to-pin note tool. Notes are positioned by `x_pct`/`y_pct` (percentage of full document width/height) so pins roughly survive resizes.
- `src/lib/waiting.js` — pure function computing whose "court" a note is in (`waitingOn`), based on who spoke last. No stored status field for this — always derived.
- `src/admin/AdminNotes.jsx` ("Tasks" in the UI, still `/admin/tasks`; `/admin/notes` redirects there) — the studio-side inbox, grouped by who's waiting on whom.
- A note thread holds at most two replies (enforced in the app, not the DB); after that the UI tells you to start a fresh note.
- `src/admin/names.js` is the single place mapping the two known account emails to display names ("Cate"/"Brandon") — update this file, not scattered logic, if an account email changes.

**Activity log**: nearly every mutating studio action calls `logAction()` (`src/lib/log.js`), a fire-and-forget insert into `site_log` that never throws or blocks the UI. `AdminActivity.jsx` just lists it — explicitly "a paper trail, not an undo button."

**Guide system** (`src/admin/guide.jsx`): a toggleable annotation layer (`Guide` in the studio, `SiteGuide` on public pages when signed in) that explains each piece of UI in place and deep-links to where it's controlled. Persisted per-browser via `localStorage`. This is developer-authored documentation embedded in the product for a non-technical stakeholder — when changing behavior these annotations describe, update the copy in the same commit or it goes stale.

**Release notes** (`src/data/releases.js` + `src/components/ReleaseNotes.jsx`): hand-maintained changelog shown once per signed-in person per version (tracked via `localStorage`), reopenable from the footer's version button. `CURRENT_VERSION` here also drives the footer display — bump it when adding a release entry.

## Database / migrations

**`supabase/schema.sql` is the full current schema** — every table, column, and policy the app uses today (cover photos, `site_notes`, `site_settings`, `album_slugs`, `note_replies`, `posts`, `site_log`, per-photo `hidden`, all included), in one file, safe to run on a fresh project or re-run on an existing one (everything is `if not exists` / `drop policy if exists` guarded). `supabase/v2.sql` through `v8.sql` are the historical migrations that originally shipped each of those pieces one at a time against the real production database — each is marked "historical, already folded into schema.sql" and kept only as a changelog; a new setup does not need to run them. When a new feature needs a schema change, write it as a new standalone `supabase/vN.sql` file in the same style (see SQL style below) **and** fold the same change into `schema.sql` so it stays the single source of truth for a fresh install. `supabase/note-from-brandon.sql` and `supabase/cate-input-notes.sql` are one-time content-seeding scripts (planting review notes for Cate), not schema.

Every table uses the same RLS shape: public `select` gated by `published`/`hidden` where relevant, plus a blanket `for all to authenticated using (true) with check (true)` policy — i.e. any signed-in user (Cate or Brandon) can do anything to any row. This is deliberate for the two-person model described above.

The public `photos` Storage bucket is fully public at the file level (`bucket_id = 'photos'`, no per-object check) — hiding a photo or leaving an album unpublished only removes it from the Postgres-backed listing APIs, it does not prevent someone with the direct storage URL from fetching the file.

**SQL style for this project** (from `schema.sql`'s own header comment): keywords lowercase (`select`, `from`, `where`, `create table`, etc.), never capitalized; table/column identifiers keep whatever case they were created with. New migrations should follow the existing `vN.sql` pattern: a header comment stating what it does and "Run whole file in Supabase > SQL Editor," full standalone runnable SQL (not a diff).

## Content model notes from the README worth knowing

- A line inside a Field Note post body that is *only* an Instagram or TikTok URL becomes an embedded post instead of text (`embedFor` in `data.js`, rendered by `PostBody.jsx`).
- `/shop` is a signed-in-only draft mockup (two pricing concepts side by side) for gathering feedback before anything is built for real — it 404s (soft "isn't here yet") for signed-out visitors and in demo mode.
