# Cate — Photography Site

Moody, quiet, nature. Dark warm-green canvas, Cormorant Garamond display,
photos that develop like prints as you scroll. Public site + `/admin` studio
where Cate uploads, reorders, and publishes collections herself.

## Run it right now (demo mode, no accounts needed)

All commands run from the project root (the folder this README is in).

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173). With no `.env`
present the site runs in **demo mode**: placeholder tone-blocks stand in for
photos so the design is reviewable before Supabase exists. `/admin` will tell
you it needs Supabase.

## Wire up Supabase (when ready — ~15 minutes)

1. Create a project at supabase.com (free tier is fine).
2. In the Supabase dashboard, open **SQL Editor**, paste the entire contents
   of `supabase/schema.sql`, and run it. This creates the tables, security
   policies, and the public `photos` storage bucket.
3. In **Authentication > Users**, click **Add user** and create Cate's
   account manually (email + password). Signups are not exposed anywhere in
   the app on purpose — she is the only user.
4. In **Project Settings > API**, copy the Project URL and the `anon` public
   key.
5. In the project root, copy `.env.example` to `.env` and paste both values in.
6. Restart the dev server (`Ctrl+C`, then `npm run dev` again — Vite only
   reads `.env` at startup).
7. Go to `/admin`, sign in as Cate, create a collection, drop photos in.

### How content maps to the site

- A collection with the slug **`featured`** powers the home page (hero =
  its first photo, then the "Selected" flow). Create one named "Featured".
- Every other **published** collection appears on `/work`.
- Order is whatever she drags it to in the studio. Hidden collections are
  invisible to the public site.
- Uploads are resized in the browser to three WebP sizes before they ever
  hit storage — originals never upload, so the free tier lasts a long time.

## Deploy + the review loop

1. Push to GitHub, import the repo in Vercel (framework preset: Vite).
2. Add the two env vars in Vercel > Project > Settings > Environment Variables.
3. Every branch push gets a Preview Deployment. Turn on **Comments** for the
   project and invite Cate — she can tap any element on a preview and leave a
   pinned comment. That is the feedback cycle: branch → preview → her
   comments → fix → merge to main = live site.

## Placeholders to replace together

- `src/pages/About.jsx` — write her bio in her voice
- `src/pages/Contact.jsx` — real email + Instagram
- `index.html` title + the wordmark in `src/components/Nav.jsx` if she wants
  a last name or studio name
- Captions/places: editable per photo in the `photos` table for now; a
  caption editor in the studio is a good v2.
