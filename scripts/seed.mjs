// One-time seed: uploads the processed photos in public/photos to Supabase
// Storage and creates the starting collections, all published.
//
// Run from the project root:   node scripts/seed.mjs
// Needs .env with VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { randomUUID } from "node:crypto";

// ——— tiny .env parser (no extra dependency) ———
function loadEnv(path = ".env") {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !line.trim().startsWith("#")) out[m[1]] = m[2];
  }
  return out;
}

const env = { ...loadEnv(), ...process.env };
const url = env.VITE_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env — see the setup doc."
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey);
const BUCKET = "photos";

// ——— the photographs (slug matches files in public/photos) ———
const P = {
  "fog-road":       { w: 5152, h: 6864, caption: "The parkway, socked in",        place: "Blue Ridge Parkway" },
  "fog-pine":       { w: 5152, h: 6864, caption: "Holding its ground",            place: "Blue Ridge Parkway" },
  "waterfall":      { w: 5152, h: 6864, caption: "Falls in the rain",             place: "Shenandoah" },
  "dusk-ridges":    { w: 6864, h: 5152, caption: "Blue on blue, last light",      place: "Shenandoah Valley" },
  "sunrise-valley": { w: 5152, h: 6864, caption: "First light over the valley",   place: "Blue Ridge" },
  "sunrise-close":  { w: 3146, h: 4192, caption: "The sun, close enough to hold", place: "Blue Ridge" },
  "meadow-walk":    { w: 6382, h: 4790, caption: "Four of us, headed home",       place: "Roanoke Valley" },
  "river-gorge":    { w: 5152, h: 6864, caption: "The long way through",          place: "New River Gorge" },
  "forest-path":    { w: 5152, h: 6864, caption: "Green on green",                place: "Appalachian Trail" },
  "sycamore-roots": { w: 5152, h: 6864, caption: "Sycamore, holding the bank",    place: "Creekside" },
  "joe-pye":        { w: 2266, h: 3022, caption: "Joe-Pye weed, one visitor",     place: "Late summer" },
  "dogwood-night":  { w: 3424, h: 2568, caption: "Dogwood after dark",            place: "April, Virginia" },
  "beach-two":      { w: 5152, h: 6864, caption: "Two chairs, grey Atlantic",     place: "Myrtle Beach" },
  "natural-bridge": { w: 2560, h: 3840, caption: "Under the bridge",              place: "Natural Bridge, Virginia" },
};

const ALBUMS = [
  { title: "Featured",       slug: "featured",         photos: ["fog-road", "dusk-ridges", "sycamore-roots", "beach-two", "dogwood-night", "sunrise-valley"] },
  { title: "Fog",            slug: "fog",              photos: ["fog-road", "fog-pine", "waterfall"] },
  { title: "Ridge & Valley", slug: "ridge-and-valley", photos: ["dusk-ridges", "sunrise-valley", "meadow-walk", "river-gorge", "sunrise-close"] },
  { title: "Understory",     slug: "understory",       photos: ["forest-path", "sycamore-roots", "joe-pye", "dogwood-night"] },
  { title: "Two",            slug: "two",              photos: ["beach-two", "natural-bridge"] },
];

async function main() {
  // Refuse to run twice — the studio owns the data after seeding.
  const { data: existing, error: checkErr } = await supabase
    .from("albums")
    .select("id")
    .limit(1);
  if (checkErr) {
    console.error("Could not reach the database:", checkErr.message);
    process.exit(1);
  }
  if (existing.length > 0) {
    console.error(
      "Albums already exist — seed will not run again. Manage everything from /admin now.\n" +
      "(To truly start over: delete all rows in photos and albums plus the photos bucket contents, then re-run.)"
    );
    process.exit(1);
  }

  for (const [ai, album] of ALBUMS.entries()) {
    const { data: a, error: aErr } = await supabase
      .from("albums")
      .insert({ title: album.title, slug: album.slug, published: true, sort_order: ai })
      .select()
      .single();
    if (aErr) throw new Error(`Creating "${album.title}": ${aErr.message}`);
    console.log(`Collection: ${album.title}`);

    for (const [pi, slug] of album.photos.entries()) {
      const meta = P[slug];
      const id = randomUUID();
      const paths = {};
      for (const sfx of ["sm", "md", "lg"]) {
        const file = readFileSync(`public/photos/${slug}-${sfx}.webp`);
        const path = `${a.id}/${id}-${sfx}.webp`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { contentType: "image/webp" });
        if (upErr) throw new Error(`Uploading ${slug}-${sfx}: ${upErr.message}`);
        paths[sfx] = path;
      }
      const { error: pErr } = await supabase.from("photos").insert({
        id,
        album_id: a.id,
        path_sm: paths.sm,
        path_md: paths.md,
        path_lg: paths.lg,
        width: meta.w,
        height: meta.h,
        caption: meta.caption,
        place: meta.place,
        sort_order: pi,
      });
      if (pErr) throw new Error(`Saving ${slug}: ${pErr.message}`);
      console.log(`   ${slug}`);
    }
  }
  console.log("\nDone. Open the site — everything is live. The studio owns it from here.");
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
