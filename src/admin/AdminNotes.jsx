import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Guide } from "./guide";
import { displayName } from "./names";
import { waitingOn, waitingLabel } from "../lib/waiting";
import { otherName } from "./names";

export default function AdminNotes() {
  const [notes, setNotes] = useState([]);
  const [showResolved, setShowResolved] = useState(false);

  const [replyFor, setReplyFor] = useState(null);
  const [replyText, setReplyText] = useState("");
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

  async function saveReply(note, resolveAfter = false) {
    if (!replyText.trim()) return;
    await supabase.from("note_replies").insert({
      note_id: note.id,
      reply: replyText.trim(),
      author: session?.user?.email || null,
    });
    if (resolveAfter) {
      await supabase.from("site_notes").update({ resolved: true }).eq("id", note.id);
    }
    setReplyFor(null);
    setReplyText("");
    load();
  }

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
      <Link to="/admin" className="label">← studio</Link>
      <h1>Notes</h1>
      <Guide to="/" linkLabel="Go add one on the site">
        Add note pins a thought to any spot on any page, including the studio pages, and it
        lands here. Notes sort by whose court the ball is in: an unanswered note waits on the
        other person, and each reply flips it. A note holds at most two replies; after that,
        start a fresh one. Reply answers and keeps it open. Reply &amp; resolve answers and
        closes it in one go. Resolve closes without a reply, Reopen brings one back, Delete
        removes it for good.
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
      {(() => {
        const my = session?.user?.email || "";
        const withState = notes.map((x) => ({ ...x, _w: waitingOn(x, my) }));
        const groups = [
          { title: "Waiting on you", cls: "group-mine", items: withState.filter((x) => !x.resolved && x._w.mine) },
          { title: `Waiting on ${otherName(my)}`, cls: "group-theirs", items: withState.filter((x) => !x.resolved && !x._w.mine) },
          { title: "Resolved", cls: "group-done", items: withState.filter((x) => x.resolved) },
        ].filter((g) => g.items.length > 0);
        return groups.length === 0 ? (
          <div className="card">
            <p className="msg">
              Nothing here. Notes appear when someone signed in uses &ldquo;Leave a note&rdquo;
              on the site.
            </p>
          </div>
        ) : (
          groups.map((g) => (
            <div className={`card ${g.cls}`} key={g.title}>
              <span className="label group-title">{g.title}</span>
              {g.items.map((n) => renderNote(n))}
            </div>
          ))
        );
      })()}
    </main>
  );

  function renderNote(n) {
    return (
          <div className="row" key={n.id} style={{ alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: "var(--bone)" }}>
                <span className="note-author">{displayName(n.author)}</span> {n.note}
              </div>
              {n.note_replies.map((r) => (
                <div className="notes-list-reply" key={r.id}>
                  <span className="note-author">{displayName(r.author)}</span> {r.reply}
                </div>
              ))}
              <div className="hint">
                {!n.resolved && (
                  <span className={`waiting-chip${n._w.mine ? " mine" : ""}`}>
                    {waitingLabel(n._w, session?.user?.email)}
                  </span>
                )}{" "}
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
                    <button onClick={() => saveReply(n)} disabled={!replyText.trim()}>Reply</button>
                    <button onClick={() => saveReply(n, true)} disabled={!replyText.trim()}>
                      Reply &amp; resolve
                    </button>
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
    );
  }
}
