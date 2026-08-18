import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { supabase } from "../lib/supabase";
import { publicUrl, WALL_LAYOUTS, getWallLayout, setWallLayout } from "../lib/data";

function slugify(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function firstName(email) {
  if (!email) return "there";
  const raw = email.split("@")[0].split(/[._-]/)[0];
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Up late";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function SortableAlbumRow({ album, onTogglePublish }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: album.id });
  const cover =
    album.photos.find((p) => p.id === album.cover_photo_id) ||
    [...album.photos].sort((a, b) => a.sort_order - b.sort_order)[0];
  return (
    <div
      ref={setNodeRef}
      className="album-row"
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 }}
    >
      <span className="drag-handle" title="Drag to reorder" {...attributes} {...listeners}>⠿</span>
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

  async function onDragEnd({ active, over }) {
    if (!over || active.id === over.id) return;
    const oldIndex = albums.findIndex((a) => a.id === active.id);
    const newIndex = albums.findIndex((a) => a.id === over.id);
    const next = arrayMove(albums, oldIndex, newIndex);
    setAlbums(next);
    await Promise.all(
      next.map((a, i) => supabase.from("albums").update({ sort_order: i }).eq("id", a.id))
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
          <Link to="/admin/notes"><button className="ghost">Notes</button></Link>
          <button className="ghost" onClick={() => supabase.auth.signOut()}>Sign out</button>
        </nav>
      </header>

      <div className="card">
        <span className="label">New collection</span>
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
        {albums.length === 0 && <p className="msg">No collections yet — create the first one above.</p>}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={albums.map((a) => a.id)} strategy={verticalListSortingStrategy}>
            {albums.map((a) => (
              <SortableAlbumRow key={a.id} album={a} onTogglePublish={togglePublish} />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      <div className="card">
        <span className="label">Home page wall</span>
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
          How the three wall frames arrange themselves.
          {layoutSaved && <span className="msg"> Saved — the site updates on next load.</span>}
        </p>
      </div>
    </main>
  );
}
