import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { supabase } from "../lib/supabase";

function slugify(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function SortableAlbumRow({ album, onTogglePublish }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: album.id });
  return (
    <div
      ref={setNodeRef}
      className="row"
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 }}
    >
      <span className="drag-handle" title="Drag to reorder" {...attributes} {...listeners}>⠿</span>
      <Link to={`/admin/${album.id}`} style={{ color: "var(--bone)", flex: 1 }}>
        {album.title}{" "}
        <span className="hint">/{album.slug} · {album.photos.length} photos</span>
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
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  async function load() {
    const { data, error } = await supabase
      .from("albums")
      .select("id, title, slug, published, sort_order, photos:photos!photos_album_id_fkey(id)")
      .order("sort_order");
    if (!error) setAlbums(data);
  }

  useEffect(() => {
    load();
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

  return (
    <main className="admin">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h1>Collections</h1>
        <button className="ghost" onClick={() => supabase.auth.signOut()}>Sign out</button>
      </div>

      <div className="card">
        <input
          type="text"
          placeholder="New collection title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && createAlbum()}
        />
        <button onClick={createAlbum} disabled={busy || !title.trim()}>
          Create collection
        </button>
        <p className="hint">
          The collection with the slug &ldquo;featured&rdquo; is the home page. Drag rows to set
          the order collections appear on the site.
        </p>
      </div>

      <div className="card">
        {albums.length === 0 && <p className="msg">No collections yet — create the first one above.</p>}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={albums.map((a) => a.id)} strategy={verticalListSortingStrategy}>
            {albums.map((a) => (
              <SortableAlbumRow key={a.id} album={a} onTogglePublish={togglePublish} />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </main>
  );
}
