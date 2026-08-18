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
  };
}

function shapeAlbum(a) {
  const photos = (a.photos || [])
    .sort((x, y) => x.sort_order - y.sort_order)
    .map(shapePhoto);
  const cover = photos.find((p) => p.id === a.cover_photo_id) || photos[0] || null;
  return { ...a, photos, cover };
}

const ALBUM_SELECT =
  "id, slug, title, published, sort_order, cover_photo_id, photos:photos!photos_album_id_fkey(id, path_sm, path_md, path_lg, width, height, caption, place, sort_order)";

export async function getAlbums() {
  if (DEMO)
    return sampleAlbums.map((a) => ({ ...a, cover: a.photos[0] || null }));
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
    return a ? { ...a, cover: a.photos[0] || null } : null;
  }
  const { data, error } = await supabase
    .from("albums")
    .select(ALBUM_SELECT)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data ? shapeAlbum(data) : null;
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
  { value: "anchor-right", label: "Anchor right — tall frame right, pair left" },
  { value: "anchor-left", label: "Anchor left — tall frame left, pair right" },
  { value: "row", label: "Even row — three frames, gently staggered" },
];

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
