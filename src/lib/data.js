import { supabase, DEMO } from "./supabase";
import { sampleAlbums, sampleFeatured } from "../data/sample";

const BUCKET = "photos";

export function publicUrl(path) {
  if (!path) return null;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function shapePhoto(row) {
  return {
    id: row.id,
    src_sm: publicUrl(row.path_sm),
    src_md: publicUrl(row.path_md),
    src_lg: publicUrl(row.path_lg),
    width: row.width,
    height: row.height,
    caption: row.caption || "",
    place: row.place || "",
    hidden: !!row.hidden,
  };
}

function shapeAlbum(a) {
  const photos = (a.photos || [])
    .sort((x, y) => x.sort_order - y.sort_order)
    .map(shapePhoto);
  const visible = photos.filter((p) => !p.hidden);
  const cover =
    visible.find((p) => p.id === a.cover_photo_id) || visible[0] || null;
  return { ...a, photos, cover, visibleCount: visible.length };
}

const ALBUM_SELECT =
  "id, slug, title, published, sort_order, cover_photo_id, photos:photos!photos_album_id_fkey(id, path_sm, path_md, path_lg, width, height, caption, place, sort_order, hidden)";

export async function getAlbums() {
  if (DEMO)
    return sampleAlbums.map((a) => ({ ...a, cover: a.photos[0] || null, visibleCount: a.photos.length }));
  const { data, error } = await supabase
    .from("albums")
    .select(ALBUM_SELECT)
    .eq("published", true)
    .order("sort_order");
  if (error) throw error;
  return data.map(shapeAlbum);
}

// Fetches by slug with no published filter. Row-level security does the
// gatekeeping: visitors only ever receive published collections, while a
// signed-in Cate also receives her drafts — which powers preview mode.
export async function getAlbum(slug) {
  if (DEMO) {
    const a = sampleAlbums.find((x) => x.slug === slug);
    return a ? { ...a, cover: a.photos[0] || null, visibleCount: a.photos.length } : null;
  }
  const { data, error } = await supabase
    .from("albums")
    .select(ALBUM_SELECT)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (data) return shapeAlbum(data);
  // Not a current slug. Check the history: renamed collections keep their
  // old links alive, and the page redirects to the current address.
  const { data: alias } = await supabase
    .from("album_slugs")
    .select("album_id")
    .eq("slug", slug)
    .maybeSingle();
  if (!alias) return null;
  const { data: byId, error: idErr } = await supabase
    .from("albums")
    .select(ALBUM_SELECT)
    .eq("id", alias.album_id)
    .maybeSingle();
  if (idErr) throw idErr;
  return byId ? shapeAlbum(byId) : null;
}

export async function getFeatured() {
  if (DEMO) return sampleFeatured;
  const { data, error } = await supabase
    .from("albums")
    .select(ALBUM_SELECT)
    .eq("slug", "featured")
    .eq("published", true)
    .maybeSingle();
  if (error) throw error;
  if (data) return shapeAlbum(data).photos;
  const albums = await getAlbums();
  return albums[0] ? albums[0].photos : [];
}

// ——— site settings ———

export const WALL_LAYOUTS = [
  { value: "anchor-right", label: "Wall, anchor right: tall frame right, pair left" },
  { value: "anchor-left", label: "Wall, anchor left: tall frame left, pair right" },
  { value: "row", label: "Wall, even row: three frames, gently staggered" },
  { value: "one-frame", label: "One frame: name beside a single large photo" },
  { value: "straight-in", label: "Straight in: name and tagline, then the flow" },
];

// How many Featured photos the opening consumes in each mode.
export function openingCount(layout) {
  if (layout === "one-frame") return 1;
  if (layout === "straight-in") return 0;
  return 3;
}

export async function getWallLayout() {
  if (DEMO) return "anchor-right";
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "wall_layout")
    .maybeSingle();
  return data?.value || "anchor-right";
}

export async function setWallLayout(value) {
  await supabase.from("site_settings").upsert({ key: "wall_layout", value });
}

// ——— Field Notes ———

const POST_SELECT =
  "id, title, slug, body, published, published_at, created_at, cover:photos(path_sm, path_md, path_lg, width, height, caption)";

function shapePost(p) {
  return {
    ...p,
    cover: p.cover
      ? {
          src_sm: publicUrl(p.cover.path_sm),
          src_md: publicUrl(p.cover.path_md),
          src_lg: publicUrl(p.cover.path_lg),
          width: p.cover.width,
          height: p.cover.height,
          caption: p.cover.caption || "",
        }
      : null,
  };
}

export async function getPosts() {
  if (DEMO) return [];
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("published", true)
    .order("published_at", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return data.map(shapePost);
}

export async function getPost(slug) {
  if (DEMO) return null;
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data ? shapePost(data) : null;
}

// A line that is nothing but an Instagram or TikTok link becomes an embed.
export function embedFor(line) {
  const t = line.trim();
  let m = t.match(/^https?:\/\/(?:www\.)?instagram\.com\/(p|reel)\/([A-Za-z0-9_-]+)/);
  if (m) return { kind: "instagram", src: `https://www.instagram.com/${m[1]}/${m[2]}/embed/` };
  m = t.match(/^https?:\/\/(?:www\.)?tiktok\.com\/@[^/]+\/video\/(\d+)/);
  if (m) return { kind: "tiktok", src: `https://www.tiktok.com/embed/v2/${m[1]}` };
  return null;
}
