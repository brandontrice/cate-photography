import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { supabase } from "../lib/supabase";
import { publicUrl } from "../lib/data";
import { Guide } from "./guide";
import { logAction } from "../lib/log";
import { displayName as firstName } from "./names";
import { slugify } from "../lib/slug";

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Up late";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function AlbumRowBody({ album, onTogglePublish }) {
  const vis = album.photos.filter((p) => !p.hidden);
  const cover =
    vis.find((p) => p.id === album.cover_photo_id) ||
    [...vis].sort((a, b) => a.sort_order - b.sort_order)[0];
  return (
    <>
      <Link to={`/admin/${album.id}`} className="album-row-main">
        <span className="album-thumb">
          {cover ? <img src={publicUrl(cover.path_sm)} alt="" /> : <span className="album-thumb-empty" />}
        </span>
        <span className="album-row-text">
          <span className="album-row-title">{album.title}</span>
          <span className="hint">
            {album.photos.length} photograph{album.photos.length === 1 ? "" : "s"}
            {album.photos.some((p) => p.hidden) &&
              ` · ${album.photos.filter((p) => p.hidden).length} hidden`}
            {album.slug === "featured" && " · the home page"}
          </span>
        </span>
      </Link>
      <a
        className="hint preview-link"
        href={`/work/${album.slug}`}
        target="_blank"
        rel="noreferrer"
        title="See it as visitors will"
      >
        Preview ↗
      </a>
      <label className="toggle">
        <input type="checkbox" checked={album.published} onChange={() => onTogglePublish(album)} />
        {album.published ? "Published" : "Hidden"}
      </label>
    </>
  );
}

// Featured: pinned in place — it drives the home page, not the /work order.
function PinnedAlbumRow({ album, onTogglePublish }) {
  return (
    <div className="album-row pinned">
      <span className="drag-handle pin" title="Featured stays put. It is the home page">⌂</span>
      <AlbumRowBody album={album} onTogglePublish={onTogglePublish} />
    </div>
  );
}

function SortableAlbumRow({ album, onTogglePublish }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: album.id });
  return (
    <div
      ref={setNodeRef}
      className="album-row"
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 }}
    >
      <span className="drag-handle" title="Drag to reorder" {...attributes} {...listeners}>⠿</span>
      <AlbumRowBody album={album} onTogglePublish={onTogglePublish} />
    </div>
  );
}

export default function AdminAlbums() {
  const [albums, setAlbums] = useState([]);
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  async function load() {
    const { data, error } = await supabase
      .from("albums")
      .select(
        "id, title, slug, published, sort_order, cover_photo_id, photos:photos!photos_album_id_fkey(id, path_sm, sort_order, hidden)"
      )
      .order("sort_order");
    if (!error) setAlbums(data);
  }

  useEffect(() => {
    load();
    supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user?.email || ""));
  }, []);

  async function createAlbum() {
    if (!title.trim()) return;
    setBusy(true);
    await supabase.from("albums").insert({
      title: title.trim(),
      slug: slugify(title),
      sort_order: albums.length,
      published: false,
    });
    logAction("created collection", title.trim());
    setTitle("");
    setBusy(false);
    load();
  }

  async function togglePublish(album) {
    await supabase.from("albums").update({ published: !album.published }).eq("id", album.id);
    logAction(album.published ? "hid collection" : "published collection", album.title);
    load();
  }

  const featured = albums.find((a) => a.slug === "featured");
  const sortable = albums.filter((a) => a.slug !== "featured");

  async function onDragEnd({ active, over }) {
    if (!over || active.id === over.id) return;
    const oldIndex = sortable.findIndex((a) => a.id === active.id);
    const newIndex = sortable.findIndex((a) => a.id === over.id);
    const next = arrayMove(sortable, oldIndex, newIndex);
    setAlbums(featured ? [featured, ...next] : next);
    await supabase.from("albums").upsert(next.map((a, i) => ({ id: a.id, sort_order: i + 1 })));
    logAction("reordered collections");
  }

  const photoCount = albums.reduce((n, a) => n + a.photos.length, 0);
  const hiddenCount = albums.reduce((n, a) => n + a.photos.filter((p) => p.hidden).length, 0);
  const publishedCount = albums.filter((a) => a.published).length;

  return (
    <main className="admin">
      <header className="studio-head">
        <div>
          <span className="label">The studio</span>
          <h1 className="studio-greeting">
            {greeting()}, {firstName(email)}.
          </h1>
          <p className="studio-stats hint">
            {albums.length} collection{albums.length === 1 ? "" : "s"} · {photoCount} photograph
            {photoCount === 1 ? "" : "s"} · {publishedCount} published
            {hiddenCount > 0 && ` · ${hiddenCount} hidden`}
          </p>
        </div>
        <nav className="studio-nav">
          <Link to="/" className="studio-nav-link">← view site</Link>
        </nav>
      </header>

      <div className="area-tabs">
        <span className="area-tab current">collections</span>
        <Link to="/admin/posts" className="area-tab">field notes</Link>
        <Link to="/admin/activity" className="area-tab quiet">activity</Link>
      </div>

      <div className="card">
        <span className="label">Collections</span>
        <Guide to="/work" linkLabel="See the collections page">
          A collection is a set of photographs with its own page on the site, like a chapter.
          Type a title and create it. It starts hidden, so nobody sees it until you publish.
          Fill it, arrange it, preview it, then flip it on.
        </Guide>
        <div className="new-collection">
          <input
            type="text"
            placeholder="Collection title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createAlbum()}
          />
          <button onClick={createAlbum} disabled={busy || !title.trim()}>
            Create
          </button>
        </div>
        <p className="hint" style={{ marginTop: "1rem" }}>
          Drag to set the order they appear on the site. The Featured collection hangs its first
          three photos on the home page wall.
        </p>
        <Guide to="/work" linkLabel="See this order on the site">
          Everything here is live on the site. The grip dots drag a collection up or down,
          and that order is exactly the order visitors see. Featured is pinned because it is
          the home page rather than a page of its own. Preview opens a collection the way a
          visitor sees it, and drafts get a banner only we can see. The Published switch is
          the only thing standing between a draft and the public. To rename a collection,
          open it and click its title. The home page opening is chosen inside Featured,
          where the photos that fill it live.
        </Guide>
        {albums.length === 0 && <p className="msg">No collections yet. Create the first one above.</p>}
        {featured && <PinnedAlbumRow album={featured} onTogglePublish={togglePublish} />}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={sortable.map((a) => a.id)} strategy={verticalListSortingStrategy}>
            {sortable.map((a) => (
              <SortableAlbumRow key={a.id} album={a} onTogglePublish={togglePublish} />
            ))}
          </SortableContext>
        </DndContext>
      </div>

    </main>
  );
}
