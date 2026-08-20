import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Guide } from "./guide";
import { logAction } from "../lib/log";
import { slugify } from "../lib/slug";

export default function AdminPosts() {
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data } = await supabase
      .from("posts")
      .select("id, title, slug, published, published_at, created_at")
      .order("created_at", { ascending: false });
    setPosts(data || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function createPost() {
    if (!title.trim()) return;
    setBusy(true);
    const { data } = await supabase
      .from("posts")
      .insert({ title: title.trim(), slug: slugify(title) })
      .select()
      .single();
    logAction("created entry", title.trim());
    setTitle("");
    setBusy(false);
    if (data) window.location.href = `/admin/posts/${data.id}`;
  }

  async function togglePublish(p) {
    await supabase
      .from("posts")
      .update({
        published: !p.published,
        published_at: !p.published ? new Date().toISOString() : p.published_at,
      })
      .eq("id", p.id);
    logAction(p.published ? "unpublished entry" : "published entry", p.title);
    load();
  }

  return (
    <main className="admin">
      <Link to="/admin" className="label">← studio</Link>
      <h1>Field Notes</h1>
      <div className="area-tabs">
        <Link to="/admin" className="area-tab">collections</Link>
        <span className="area-tab current">field notes</span>
        <Link to="/admin/activity" className="area-tab quiet">activity</Link>
      </div>
      <Guide to="/journal" linkLabel="See Field Notes on the site">
        Entries start as drafts. Write in plain sentences; a blank line starts a new
        paragraph, and a line that is only an Instagram or TikTok link becomes the embedded
        post. Preview shows an entry exactly as visitors will see it. Publish when ready;
        Field Notes appears in the site menu once the first entry is live.
      </Guide>

      <div className="card">
        <span className="label">New entry</span>
        <div className="new-collection">
          <input
            type="text"
            placeholder="Entry title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createPost()}
          />
          <button onClick={createPost} disabled={busy || !title.trim()}>Create</button>
        </div>
      </div>

      <div className="card">
        <span className="label">Entries</span>
        {posts.length === 0 && <p className="msg">Nothing yet. Create the first entry above.</p>}
        {posts.map((p) => (
          <div className="row" key={p.id}>
            <Link to={`/admin/posts/${p.id}`} style={{ color: "var(--bone)", flex: 1 }}>
              {p.title}{" "}
              <span className="hint">
                {new Date(p.published_at || p.created_at).toLocaleDateString()}
              </span>
            </Link>
            <a
              className="hint preview-link"
              href={`/journal/${p.slug}`}
              target="_blank"
              rel="noreferrer"
            >
              Preview ↗
            </a>
            <label className="toggle">
              <input type="checkbox" checked={p.published} onChange={() => togglePublish(p)} />
              {p.published ? "Published" : "Draft"}
            </label>
          </div>
        ))}
      </div>
    </main>
  );
}
