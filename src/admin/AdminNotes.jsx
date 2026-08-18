import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AdminNotes() {
  const [notes, setNotes] = useState([]);
  const [showResolved, setShowResolved] = useState(false);

  async function load() {
    let q = supabase.from("site_notes").select("*").order("created_at", { ascending: false });
    if (!showResolved) q = q.eq("resolved", false);
    const { data } = await q;
    setNotes(data || []);
  }

  useEffect(() => {
    load();
  }, [showResolved]);

  async function toggleResolved(n) {
    await supabase.from("site_notes").update({ resolved: !n.resolved }).eq("id", n.id);
    load();
  }

  async function remove(n) {
    if (!window.confirm("Delete this note for good?")) return;
    await supabase.from("site_notes").delete().eq("id", n.id);
    load();
  }

  return (
    <main className="admin">
      <Link to="/admin" className="label">← Collections</Link>
      <h1>Notes</h1>
      <div className="card">
        <label className="toggle">
          <input
            type="checkbox"
            checked={showResolved}
            onChange={(e) => setShowResolved(e.target.checked)}
          />
          Show resolved
        </label>
      </div>
      <div className="card">
        {notes.length === 0 && (
          <p className="msg">
            Nothing here. Notes appear when someone signed in uses &ldquo;Leave a note&rdquo; on
            the site.
          </p>
        )}
        {notes.map((n) => (
          <div className="row" key={n.id} style={{ alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: "var(--bone)" }}>{n.note}</div>
              <div className="hint">
                <a href={n.path} target="_blank" rel="noreferrer" className="preview-link">
                  {n.path} ↗
                </a>{" "}
                · {new Date(n.created_at).toLocaleDateString()}
                {n.resolved ? " · resolved" : ""}
              </div>
            </div>
            <button className="ghost" onClick={() => toggleResolved(n)}>
              {n.resolved ? "Reopen" : "Resolve"}
            </button>
            <button className="ghost danger" onClick={() => remove(n)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
