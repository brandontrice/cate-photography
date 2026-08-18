import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Guide, GuideToggle } from "./guide";
import { displayName } from "./names";

export default function AdminNotes() {
  const [notes, setNotes] = useState([]);
  const [showResolved, setShowResolved] = useState(false);

  const [replyFor, setReplyFor] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replyStatus, setReplyStatus] = useState("");
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, []);

  async function load() {
    let q = supabase
      .from("site_notes")
      .select("*, note_replies(*)")
      .order("created_at", { ascending: false });
    if (!showResolved) q = q.eq("resolved", false);
    const { data } = await q;
    setNotes(
      (data || []).map((x) => ({
        ...x,
        note_replies: (x.note_replies || []).sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        ),
      }))
    );
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div>
          <Link to="/admin" className="label">← Collections</Link>
          <h1>Notes</h1>
        </div>
        <GuideToggle />
      </div>
      <Guide to="/" linkLabel="Go leave one on the site">
        Notes come from the &ldquo;Leave a note&rdquo; button on the site. Pin one to any
        spot on any page while signed in, and it lands here. This list is the to-do pile.
        The path link jumps to the page, Resolve clears the pin from the site, Reopen brings
        it back, Delete removes it entirely.
      </Guide>
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
              <div style={{ color: "var(--bone)" }}>
                <span className="note-author">{displayName(n.author)}</span> {n.note}
              </div>
              {n.note_replies.map((r) => (
                <div className="notes-list-reply" key={r.id}>
                  <span className="note-author">{displayName(r.author)}</span>
                  {r.status && <span className={`status-chip s-${r.status}`}>{r.status}</span>}{" "}
                  {r.reply}
                </div>
              ))}
              <div className="hint">
                <a href={n.path} target="_blank" rel="noreferrer" className="preview-link">
                  {n.path} ↗
                </a>{" "}
                · {new Date(n.created_at).toLocaleDateString()}
                {n.resolved ? " · resolved" : ""}
              </div>
              {replyFor === n.id ? (
                <div className="notes-reply-form">
                  <textarea
                    rows={2}
                    autoFocus
                    placeholder="Reply"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <div className="note-reply-row">
                    <select value={replyStatus} onChange={(e) => setReplyStatus(e.target.value)}>
                      <option value="">No status</option>
                      <option value="Answered">Answered</option>
                      <option value="Done">Done</option>
                      <option value="Won't do">Won&apos;t do</option>
                    </select>
                    <button onClick={() => saveReply(n)} disabled={!replyText.trim()}>Reply</button>
                    <button className="ghost" onClick={() => setReplyFor(null)}>Cancel</button>
                  </div>
                </div>
              ) : n.note_replies.length < 2 ? (
                <button
                  className="ghost"
                  style={{ marginTop: "0.5rem" }}
                  onClick={() => {
                    setReplyFor(n.id);
                    setReplyText("");
                    setReplyStatus("");
                  }}
                >
                  Reply
                </button>
              ) : (
                <p className="hint" style={{ marginTop: "0.5rem" }}>
                  Thread full. Start a fresh note if there is more to say.
                </p>
              )}
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
