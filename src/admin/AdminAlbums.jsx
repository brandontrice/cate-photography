import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { supabase } from "../lib/supabase";
import { publicUrl, WALL_LAYOUTS, getWallLayout, setWallLayout } from "../lib/data";
import { Guide, GuideToggle } from "./guide";
import { displayName as firstName } from "./names";

function slugify(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Up late";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function AlbumRowBody({ album, onTogglePublish }) {
  const cover =
    album.photos.find((p) => p.id === album.cover_photo_id) ||
    [...album.photos].sort((a, b) => a.sort_order - b.sort_order)[0];
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
  const [layout, setLayout] = useState("anchor-right");
  const [layoutSaved, setLayoutSaved] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  async function load() {
    const { data, error } = await supabase
      .from("albums")
      .select(
        "id, title, slug, published, sort_order, cover_photo_id, photos:photos!photos_album_id_fkey(id, path_sm, sort_order)"
      )
      .order("sort_order");
    if (!error) setAlbums(data);
  }

  useEffect(() => {
    load();
    getWallLayout().then(setLayout).catch(() => {});
    supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user?.email || ""));
  }, []);

  async function changeLayout(value) {
    setLayout(value);
    await setWallLayout(value);
    setLayoutSaved(true);
    setTimeout(() => setLayoutSaved(false), 2000);
  }

  async function createAlbum() {
    if (!title.trim()) return;
    setBusy(true);
    await supabase.from("albums").insert({
      title: title.trim(),
      slug: slugify(title),
      sort_order: albums.length,
      published: false,
    });
    setTitle("");
    setBusy(false);
    load();
  }

  async function togglePublish(album) {
    await supabase.from("albums").update({ published: !album.published }).eq("id", album.id);
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
    await Promise.all(
      next.map((a, i) => supabase.from("albums").update({ sort_order: i + 1 }).eq("id", a.id))
    );
  }

  const photoCount = albums.reduce((n, a) => n + a.photos.length, 0);
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
          </p>
        </div>
        <nav className="studio-nav">
          <Link to="/" className="studio-nav-link">← View site</Link>
          <GuideToggle />
          <Link to="/admin/notes"><button className="ghost">Notes</button></Link>
          <Link to="/admin/reset"><button className="ghost">Password</button></Link>
          <button className="ghost" onClick={() => supabase.auth.signOut()}>Sign out</button>
        </nav>
      </header>

      <div className="card">
        <span className="label">New collection</span>
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
      </div>

      <div className="card">
        <span className="label">Collections</span>
        <p className="hint" style={{ marginTop: "0.4rem" }}>
          Drag to set the order they appear on the site. The Featured collection hangs its first
          three photos on the home page wall.
        </p>
        <Guide to="/work" linkLabel="See this order on the site">
          Everything here is live on the site. The grip dots drag a collection up or down,
          and that order is exactly the order visitors see. Featured is pinned because it is
          the home page rather than a page of its own. Preview opens a collection the way a
          visitor sees it, and drafts get a banner only we can see. The Published switch is
          the only thing standing between a draft and the public. To rename a collection,
          open it and click its title.
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

      <div className="card">
        <span className="label">Home page opening</span>
        <Guide to="/" linkLabel="See the opening on the home page">
          The home page opening comes from the front of Featured, in drag order. Wall modes
          hang the first three photos, One frame shows just the first, and Straight in skips
          frames entirely and moves right into the flow. Change it, reload the site, see it.
        </Guide>
        <select
          id="wall-layout"
          className="layout-select"
          value={layout}
          onChange={(e) => changeLayout(e.target.value)}
        >
          {WALL_LAYOUTS.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
        <p className="hint">
          How the home page opens: a three-frame wall, a single frame, or straight into the flow.
          {layoutSaved && <span className="msg"> Saved. The site updates on next load.</span>}
        </p>
      </div>
    </main>
  );
}
