import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { publicUrl } from "../lib/data";
import { Guide, GuideToggle } from "./guide";

export default function AdminPost() {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [cover, setCover] = useState("");
  const [photos, setPhotos] = useState([]);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase.from("posts").select("*").eq("id", postId).single();
      if (p) {
        setPost(p);
        setTitle(p.title);
        setBody(p.body || "");
        setCover(p.cover_photo_id || "");
      }
      const { data: ph } = await supabase
        .from("photos")
        .select("id, path_sm, caption, albums(title)")
        .order("created_at");
      setPhotos(ph || []);
    })();
  }, [postId]);

  async function save() {
    await supabase
      .from("posts")
      .update({ title: title.trim() || post.title, body, cover_photo_id: cover || null })
      .eq("id", postId);
    setDirty(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!post) return <main className="admin" />;

  const coverPhoto = photos.find((p) => p.id === cover);

  return (
    <main className="admin">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div>
          <Link to="/admin/posts" className="label">← Field Notes</Link>
          <h1>{post.title}</h1>
        </div>
        <span style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <GuideToggle />
          <a className="hint preview-link" href={`/journal/${post.slug}`} target="_blank" rel="noreferrer">
            Preview ↗
          </a>
        </span>
      </div>
      <Guide>
        Write like a letter. A blank line starts a new paragraph. Paste an Instagram or
        TikTok link on its own line and it becomes the post itself on the site. Nothing
        saves until the Save button; nothing shows publicly until the entry is published
        from the Field Notes list.
      </Guide>

      <div className="card post-editor">
        <label className="hint" htmlFor="ptitle">Title</label>
        <input
          id="ptitle"
          type="text"
          value={title}
          onChange={(e) => { setTitle(e.target.value); setDirty(true); }}
        />
        <label className="hint" htmlFor="pcover">Cover photo (optional)</label>
        <select
          id="pcover"
          className="layout-select"
          value={cover}
          onChange={(e) => { setCover(e.target.value); setDirty(true); }}
        >
          <option value="">No cover</option>
          {photos.map((p) => (
            <option key={p.id} value={p.id}>
              {(p.albums?.title || "Photos") + " — " + (p.caption || "untitled")}
            </option>
          ))}
        </select>
        {coverPhoto && (
          <img className="post-cover-thumb" src={publicUrl(coverPhoto.path_sm)} alt="" />
        )}
        <label className="hint" htmlFor="pbody">Entry</label>
        <textarea
          id="pbody"
          className="post-body-input"
          value={body}
          placeholder="Write here. Blank line for a new paragraph. An Instagram or TikTok link on its own line becomes the post."
          onChange={(e) => { setBody(e.target.value); setDirty(true); }}
        />
        <div className="editor-actions">
          <button onClick={save} disabled={!dirty}>Save</button>
          {saved && <span className="msg">Saved.</span>}
        </div>
      </div>
    </main>
  );
}
