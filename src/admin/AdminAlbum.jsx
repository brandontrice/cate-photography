import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { supabase } from "../lib/supabase";
import { publicUrl, getWallLayout, openingCount } from "../lib/data";
import { prepareUpload } from "../lib/images";
import { Guide, GuideToggle } from "./guide";

const BUCKET = "photos";

function SortableThumb({ photo, isCover, wallSlot, onOpen }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: photo.id });
  return (
    <div
      ref={setNodeRef}
      className="thumb"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
      }}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(photo)}
    >
      <img src={publicUrl(photo.path_sm)} alt={photo.caption || ""} draggable={false} />
      {isCover && <span className="cover-badge">Cover</span>}
      {wallSlot && <span className="wall-badge">{wallSlot}</span>}
    </div>
  );
}

export default function AdminAlbum() {
  const { albumId } = useParams();
  const [album, setAlbum] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [status, setStatus] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [selected, setSelected] = useState(null); // photo being edited
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState("");
  const [titleErr, setTitleErr] = useState("");
  const [opening, setOpening] = useState("anchor-right");
  const [caption, setCaption] = useState("");
  const [place, setPlace] = useState("");
  const fileInput = useRef(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  async function load() {
    const { data: a } = await supabase.from("albums").select("*").eq("id", albumId).single();
    setAlbum(a);
    const { data: p } = await supabase
      .from("photos")
      .select("*")
      .eq("album_id", albumId)
      .order("sort_order");
    setPhotos(p || []);
  }

  useEffect(() => {
    load();
    getWallLayout().then(setOpening).catch(() => {});
  }, [albumId]);

  function slugify(s) {
    return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  async function saveTitle() {
    const nextTitle = titleVal.trim();
    setTitleErr("");
    if (!nextTitle) return;
    // Featured keeps its slug no matter the title: the home page finds it by that key.
    if (album.slug === "featured") {
      await supabase.from("albums").update({ title: nextTitle }).eq("id", album.id);
      setEditingTitle(false);
      return load();
    }
    const nextSlug = slugify(nextTitle);
    if (nextSlug === album.slug) {
      await supabase.from("albums").update({ title: nextTitle }).eq("id", album.id);
      setEditingTitle(false);
      return load();
    }
    // Collision check against every slug any collection has ever used.
    const { data: taken } = await supabase
      .from("album_slugs")
      .select("album_id")
      .eq("slug", nextSlug)
      .maybeSingle();
    if (taken && taken.album_id !== album.id) {
      return setTitleErr("Another collection already uses that address. Pick a different title.");
    }
    // Remember the new address alongside the old ones, then move.
    await supabase.from("album_slugs").upsert({ slug: nextSlug, album_id: album.id });
    await supabase
      .from("albums")
      .update({ title: nextTitle, slug: nextSlug })
      .eq("id", album.id);
    setEditingTitle(false);
    load();
  }

  function openEditor(photo) {
    setSelected(photo);
    setCaption(photo.caption || "");
    setPlace(photo.place || "");
  }

  async function saveEditor() {
    await supabase.from("photos").update({ caption, place }).eq("id", selected.id);
    setSelected(null);
    load();
  }

  async function setCover() {
    await supabase.from("albums").update({ cover_photo_id: selected.id }).eq("id", albumId);
    setSelected(null);
    load();
  }

  async function deleteSelected() {
    const p = selected;
    if (!window.confirm("Remove this photo? This can't be undone.")) return;
    await supabase.storage
      .from(BUCKET)
      .remove([p.path_sm, p.path_md, p.path_lg].filter(Boolean));
    await supabase.from("photos").delete().eq("id", p.id);
    setSelected(null);
    load();
  }

  async function handleFiles(files) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    let n = 0;
    for (const file of list) {
      n += 1;
      setStatus(`Preparing ${n} of ${list.length}…`);
      const { sm, md, lg, width, height } = await prepareUpload(file);
      const id = crypto.randomUUID();
      const base = `${albumId}/${id}`;
      setStatus(`Uploading ${n} of ${list.length}…`);
      const up = async (suffix, blob) => {
        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(`${base}-${suffix}.webp`, blob.blob, { contentType: "image/webp" });
        if (error) throw error;
        return `${base}-${suffix}.webp`;
      };
      const [path_sm, path_md, path_lg] = await Promise.all([
        up("sm", sm),
        up("md", md),
        up("lg", lg),
      ]);
      await supabase.from("photos").insert({
        id,
        album_id: albumId,
        path_sm,
        path_md,
        path_lg,
        width,
        height,
        sort_order: photos.length + n - 1,
      });
    }
    setStatus(list.length ? `${list.length} photo${list.length === 1 ? "" : "s"} added.` : "");
    load();
  }

  async function onDragEnd({ active, over }) {
    if (!over || active.id === over.id) return;
    const oldIndex = photos.findIndex((p) => p.id === active.id);
    const newIndex = photos.findIndex((p) => p.id === over.id);
    const next = arrayMove(photos, oldIndex, newIndex);
    setPhotos(next);
    await Promise.all(
      next.map((p, i) => supabase.from("photos").update({ sort_order: i }).eq("id", p.id))
    );
  }

  if (!album) return <main className="admin" />;

  return (
    <main className="admin">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "1rem" }}>
        <div>
          <Link to="/admin" className="label">← Collections</Link>
          {editingTitle ? (
            <div className="title-edit">
              <input
                type="text"
                autoFocus
                value={titleVal}
                onChange={(e) => setTitleVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveTitle();
                  if (e.key === "Escape") setEditingTitle(false);
                }}
              />
              <button onClick={saveTitle}>Save</button>
              <button className="ghost" onClick={() => setEditingTitle(false)}>Cancel</button>
              {titleErr && <p className="msg">{titleErr}</p>}
            </div>
          ) : (
            <h1
              className="title-editable"
              title="Click to rename"
              onClick={() => {
                setTitleVal(album.title);
                setTitleErr("");
                setEditingTitle(true);
              }}
            >
              {album.title} <span className="title-pencil">rename</span>
            </h1>
          )}
        </div>
        <span style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <GuideToggle />
          <a className="hint preview-link" href={`/work/${album.slug}`} target="_blank" rel="noreferrer">
            Preview as visitor ↗
          </a>
        </span>
      </div>

      <Guide>
        Drop photos straight from the camera export, full size is fine. Before anything
        uploads, the browser quietly makes three web-sized copies (small, medium, large) and
        sends only those, so pages load fast and storage stays light. The originals never
        leave the computer.
      </Guide>
      <div
        className={`dropzone${dragOver ? " over" : ""}`}
        onClick={() => fileInput.current.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        Drop photos here, or click to choose
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {status && <p className="msg">{status}</p>}
      <p className="hint">
        Drag thumbnails to set the order. Click a photo to edit its caption, set it as the
        cover, or remove it.
      </p>
      <Guide to={`/work/${album.slug}`} linkLabel="See this collection on the site">
        The order here is the order on the site, top-left first. Click any photo to open it.
        The caption and place lines appear under it on the site in small type. &ldquo;Use as
        cover&rdquo; makes it the face of this collection on the Work page. Remove deletes it
        for good, and it asks first. In Featured, the badges mark the home page slots: Wall 1 is the
        tall anchor, Wall 2 the upper frame of the pair, Wall 3 the small accent, and in the
        One frame opening only the first photo shows. Drag photos here to change what lands
        where. The collection title above is clickable: rename it any time, the web
        address follows the new name, and every old link quietly redirects.
      </Guide>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={photos.map((p) => p.id)} strategy={rectSortingStrategy}>
          <div className="grid">
            {photos.map((p, i) => (
              <SortableThumb
                key={p.id}
                photo={p}
                isCover={album.cover_photo_id === p.id}
                wallSlot={
                  album.slug === "featured" && i < openingCount(opening)
                    ? opening === "one-frame"
                      ? "Opening"
                      : `Wall ${i + 1}`
                    : null
                }
                onOpen={openEditor}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {selected && (
        <div className="editor-overlay" onClick={() => setSelected(null)}>
          <div className="editor card" onClick={(e) => e.stopPropagation()}>
            <img src={publicUrl(selected.path_md)} alt="" className="editor-img" />
            <label className="hint" htmlFor="cap">Caption</label>
            <input
              id="cap"
              type="text"
              value={caption}
              placeholder="What is this?"
              onChange={(e) => setCaption(e.target.value)}
            />
            <label className="hint" htmlFor="plc">Place</label>
            <input
              id="plc"
              type="text"
              value={place}
              placeholder="Where / when"
              onChange={(e) => setPlace(e.target.value)}
            />
            <div className="editor-actions">
              <button onClick={saveEditor}>Save</button>
              <button className="ghost" onClick={setCover}>Use as cover</button>
              <button className="ghost danger" onClick={deleteSelected}>Remove photo</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
