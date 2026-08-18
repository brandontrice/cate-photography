import { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { supabase, DEMO } from "../lib/supabase";
import { GuideToggle } from "../admin/guide";
import { displayName } from "../admin/names";

// When Cate is signed in, every public page grows a quiet "Leave a note"
// button. Note mode: click anywhere, the note form opens right at that spot,
// and the saved note pins there — visible on the page and in the studio.
export default function FeedbackLayer() {
  const { pathname } = useLocation();
  const [session, setSession] = useState(null);
  const [notes, setNotes] = useState([]);
  const [mode, setMode] = useState(false);
  // draft: { x_pct, y_pct, clientX, clientY } — pct anchors the pin in the
  // document; client coords place the form in the viewport next to the click.
  const [draft, setDraft] = useState(null);
  const [text, setText] = useState("");
  const [openPin, setOpenPin] = useState(null);
  const [popPlace, setPopPlace] = useState({ below: false, align: "center" });
  const [replyText, setReplyText] = useState("");
  const [replyStatus, setReplyStatus] = useState("");
  const [drawer, setDrawer] = useState(false);
  const [docHeight, setDocHeight] = useState(0);

  useEffect(() => {
    if (DEMO) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const load = useCallback(async () => {
    if (DEMO) return;
    const { data } = await supabase
      .from("site_notes")
      .select("*, note_replies(*)")
      .eq("path", pathname)
      .eq("resolved", false)
      .order("created_at");
    setNotes(
      (data || []).map((n) => ({
        ...n,
        note_replies: (n.note_replies || []).sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        ),
      }))
    );
  }, [pathname]);

  const exitMode = useCallback(() => {
    setMode(false);
    setDraft(null);
    setText("");
  }, []);

  useEffect(() => {
    if (session) load();
    exitMode();
    setOpenPin(null);
    setDrawer(false);
  }, [session, pathname, load, exitMode]);

  // Escape always leaves note mode, wherever focus is.
  useEffect(() => {
    if (!mode && !draft && openPin === null && !drawer) return;
    function onKey(e) {
      if (e.key === "Escape") {
        exitMode();
        setOpenPin(null);
        setDrawer(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mode, draft, openPin, drawer, exitMode]);

  // Track full document height so pins can sit anywhere down the page.
  useEffect(() => {
    if (!session) return;
    const measure = () => setDocHeight(document.documentElement.scrollHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [session, notes, pathname]);

  if (DEMO || !session) return null;

  function placeDraft(e) {
    // Viewport click -> document coordinates, stored as percentages so the
    // pin survives window resizes reasonably well.
    const pageX = e.clientX + window.scrollX;
    const pageY = e.clientY + window.scrollY;
    setDraft({
      x_pct: (pageX / document.documentElement.scrollWidth) * 100,
      y_pct: (pageY / document.documentElement.scrollHeight) * 100,
      clientX: e.clientX,
      clientY: e.clientY,
    });
  }

  async function saveDraft() {
    if (!text.trim()) return;
    await supabase.from("site_notes").insert({
      path: pathname,
      x_pct: draft.x_pct,
      y_pct: draft.y_pct,
      note: text.trim(),
      author: session.user.email,
    });
    exitMode();
    load();
  }

  async function saveReply(note) {
    if (!replyText.trim()) return;
    await supabase.from("note_replies").insert({
      note_id: note.id,
      reply: replyText.trim(),
      status: replyStatus || null,
      author: session.user.email,
    });
    setReplyText("");
    setReplyStatus("");
    load();
  }

  async function resolveNote(id) {
    await supabase.from("site_notes").update({ resolved: true }).eq("id", id);
    setOpenPin(null);
    load();
  }

  // Keep the draft form inside the viewport, next to the click.
  const formStyle = draft
    ? {
        left: Math.min(draft.clientX + 14, Math.max(window.innerWidth - 336, 8)),
        top: Math.min(draft.clientY + 14, Math.max(window.innerHeight - 190, 8)),
      }
    : null;

  return (
    <>
      {/* Saved pins + the provisional pin while drafting */}
      <div className="note-pins" style={{ height: docHeight }}>
        {notes.map((n, i) => (
          <button
            key={n.id}
            className="note-pin"
            style={{
              left: `${n.x_pct}%`,
              top: `${(n.y_pct / 100) * docHeight}px`,
            }}
            onClick={(e) => {
              if (openPin === n.id) return setOpenPin(null);
              const rect = e.currentTarget.getBoundingClientRect();
              setPopPlace({
                below: rect.top < 240,
                align:
                  rect.left < 150
                    ? "left"
                    : window.innerWidth - rect.right < 150
                    ? "right"
                    : "center",
              });
              setOpenPin(n.id);
            }}
            title="Open note"
          >
            {i + 1}
            {openPin === n.id && (
              <span className={`note-popover${popPlace.below ? " pop-below" : ""} pop-${popPlace.align}`} onClick={(e) => e.stopPropagation()}>
                <span className="note-author">{displayName(n.author)}</span>
                <span className="note-text">{n.note}</span>
                {n.note_replies.map((r) => (
                  <span className="note-reply" key={r.id}>
                    <span className="note-author">
                      {displayName(r.author)}
                      {r.status && <span className={`status-chip s-${r.status}`}>{r.status}</span>}
                    </span>
                    <span className="note-text">{r.reply}</span>
                  </span>
                ))}
                {n.note_replies.length < 2 ? (
                  <span className="note-reply-form">
                    <textarea
                      rows={2}
                      placeholder="Reply"
                      value={openPin === n.id ? replyText : ""}
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                    <span className="note-reply-row">
                      <select value={replyStatus} onChange={(e) => setReplyStatus(e.target.value)}>
                        <option value="">No status</option>
                        <option value="Answered">Answered</option>
                        <option value="Done">Done</option>
                        <option value="Won't do">Won&apos;t do</option>
                      </select>
                      <button onClick={() => saveReply(n)} disabled={!replyText.trim()}>Reply</button>
                    </span>
                  </span>
                ) : (
                  <span className="thread-full hint">Thread full. Start a fresh note if there is more to say.</span>
                )}
                <span className="note-actions">
                  <button onClick={() => resolveNote(n.id)}>Resolve</button>
                </span>
              </span>
            )}
          </button>
        ))}
        {draft && (
          <span
            className="note-pin draft-pin"
            style={{
              left: `${draft.x_pct}%`,
              top: `${(draft.y_pct / 100) * docHeight}px`,
            }}
          >
            +
          </span>
        )}
      </div>

      {/* Fixed click-catcher: covers the visible viewport wherever the page
          is scrolled. Scrolling still works while it is up. */}
      {mode && !draft && (
        <div className="note-catcher" onClick={placeDraft}>
          <span className="note-catcher-hint">
            Click anywhere to pin a note · Esc or Cancel to leave
          </span>
        </div>
      )}

      {/* Draft form, anchored beside the click */}
      {draft && (
        <div className="note-draft" style={formStyle}>
          <textarea
            autoFocus
            rows={3}
            placeholder="What should change here?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) saveDraft();
            }}
          />
          <div className="note-draft-actions">
            <button onClick={saveDraft} disabled={!text.trim()}>Save note</button>
            <button className="ghost" onClick={exitMode}>Cancel</button>
          </div>
        </div>
      )}

      {/* Task drawer: open notes on this page, jump + resolve */}
      {drawer && (
        <aside className="note-drawer">
          <div className="note-drawer-head">
            <span className="label">Open notes — this page</span>
            <button className="lightbox-close" style={{ position: "static" }} onClick={() => setDrawer(false)}>×</button>
          </div>
          {notes.length === 0 && <p className="hint">All clear here.</p>}
          {notes.map((n, i) => (
            <div className="note-task" key={n.id}>
              <button
                className="note-task-jump"
                title="Scroll to this note"
                onClick={() =>
                  window.scrollTo({
                    top: (n.y_pct / 100) * document.documentElement.scrollHeight - 140,
                    behavior: "smooth",
                  })
                }
              >
                {i + 1}
              </button>
              <span className="note-task-text">
                {n.note}
                {n.note_replies.map((r) => (
                  <span className="note-task-reply" key={r.id}>
                    {displayName(r.author)}
                    {r.status ? ` · ${r.status}` : ""}: {r.reply}
                  </span>
                ))}
              </span>
              <button className="note-task-done" title="Mark resolved" onClick={() => resolveNote(n.id)}>
                Done
              </button>
            </div>
          ))}
        </aside>
      )}

      {/* The toggles — present only when signed in */}
      <div className="note-controls">
        {pathname !== "/shop" && (
          <a href="/shop" className="note-signout" title="The shop mockup, visible only to us">
            Shop draft
          </a>
        )}
        <GuideToggle />
        <button
          className="note-signout"
          title="Sign out and see the site as visitors do"
          onClick={() => supabase.auth.signOut()}
        >
          Sign out
        </button>
        {notes.length > 0 && (
          <button className={`note-signout${drawer ? " drawer-open" : ""}`} onClick={() => setDrawer(!drawer)}>
            Tasks ({notes.length})
          </button>
        )}
        <button
          className={`note-toggle${mode ? " active" : ""}`}
          onClick={() => (mode || draft ? exitMode() : setMode(true))}
        >
          {mode || draft ? "Cancel" : notes.length ? `Notes (${notes.length})` : "Leave a note"}
        </button>
      </div>
    </>
  );
}
