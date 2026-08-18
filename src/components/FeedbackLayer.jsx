import { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { supabase, DEMO } from "../lib/supabase";
import { GuideToggle } from "../admin/guide";
import { displayName } from "../admin/names";
import { waitingOn, waitingLabel } from "../lib/waiting";

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
  const [toolsOpen, setToolsOpen] = useState(() => {
    try { return localStorage.getItem("tools-open") !== "closed"; } catch { return true; }
  });
  function setTools(open) {
    setToolsOpen(open);
    try { localStorage.setItem("tools-open", open ? "open" : "closed"); } catch { /* fine */ }
  }
  const [docHeight, setDocHeight] = useState(0);
  const [taskCount, setTaskCount] = useState(0);

  useEffect(() => {
    if (DEMO) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const load = useCallback(async () => {
    if (DEMO) return;
    const { data: allOpen } = await supabase
      .from("site_notes")
      .select("*, note_replies(*)")
      .eq("resolved", false);
    const { data: sess } = await supabase.auth.getSession();
    const my = sess.session?.user?.email || "";
    setTaskCount((allOpen || []).filter((x) => waitingOn(x, my).mine).length);
    const data = (allOpen || [])
      .filter((x) => x.path === pathname)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
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
  }, [session, pathname, load, exitMode]);

  // Escape always leaves note mode, wherever focus is.
  useEffect(() => {
    if (!mode && !draft && openPin === null) return;
    function onKey(e) {
      if (e.key === "Escape") {
        exitMode();
        setOpenPin(null);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mode, draft, openPin, exitMode]);

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

  async function saveReply(note, resolveAfter = false) {
    if (!replyText.trim()) return;
    await supabase.from("note_replies").insert({
      note_id: note.id,
      reply: replyText.trim(),
      author: session.user.email,
    });
    if (resolveAfter) {
      await supabase.from("site_notes").update({ resolved: true }).eq("id", note.id);
      setOpenPin(null);
    }
    setReplyText("");
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
      <div className="note-pins">
        {notes.map((n, i) => (
          <button
            key={n.id}
            className={`note-pin${waitingOn(n, session.user.email).mine ? " pin-mine" : " pin-theirs"}`}
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
                <span className="note-author">
                  {displayName(n.author)}
                  <span className={`waiting-chip${waitingOn(n, session.user.email).mine ? " mine" : ""}`}>
                    {waitingLabel(waitingOn(n, session.user.email), session.user.email)}
                  </span>
                </span>
                <span className="note-text">{n.note}</span>
                {n.note_replies.map((r) => (
                  <span className="note-reply" key={r.id}>
                    <span className="note-author">{displayName(r.author)}</span>
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
                      <button onClick={() => saveReply(n)} disabled={!replyText.trim()}>Reply</button>
                      <button onClick={() => saveReply(n, true)} disabled={!replyText.trim()}>
                        Reply &amp; resolve
                      </button>
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

      {/* Dev tools cluster: identical on the site and in the studio. */}
      <div className="note-controls">
        {toolsOpen ? (
          <>
            <GuideToggle />
            <a href="/admin/tasks" className="note-signout" title="Open notes are your tasks">
              tasks ({taskCount})
            </a>
            <button
              className={`note-toggle${mode ? " active" : ""}`}
              onClick={() => (mode || draft ? exitMode() : setMode(true))}
            >
              {mode || draft ? "cancel" : "add note"}
            </button>
            <button
              className="note-signout"
              title="Sign out and see the site as visitors do"
              onClick={() => supabase.auth.signOut()}
            >
              sign out
            </button>
            <button className="tools-hide" title="Hide these tools" onClick={() => setTools(false)}>
              ×
            </button>
          </>
        ) : (
          <button className="note-signout tools-show" onClick={() => setTools(true)}>
            tools
          </button>
        )}
      </div>
    </>
  );
}
