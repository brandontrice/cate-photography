import { useEffect, useState } from "react";
import { supabase, DEMO } from "../lib/supabase";
import { RELEASES, CURRENT_VERSION } from "../data/releases";

// Opens once per release for each signed-in person; dismiss remembers per
// browser. The footer's version button reopens it with the full history.
export default function ReleaseNotes() {
  const [session, setSession] = useState(null);
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (DEMO) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    let seen = null;
    try {
      seen = localStorage.getItem("seen-release");
    } catch { /* storage unavailable: show it, no memory */ }
    if (seen !== CURRENT_VERSION) {
      setShowAll(false);
      setOpen(true);
    }
  }, [session]);

  useEffect(() => {
    function onOpen() {
      setShowAll(true);
      setOpen(true);
    }
    window.addEventListener("open-releases", onOpen);
    return () => window.removeEventListener("open-releases", onOpen);
  }, []);

  if (!session || !open) return null;

  function dismiss() {
    try {
      localStorage.setItem("seen-release", CURRENT_VERSION);
    } catch { /* fine */ }
    setOpen(false);
  }

  const list = showAll ? RELEASES : [RELEASES[0]];

  return (
    <div className="release-overlay" onClick={dismiss}>
      <div className="release-panel" onClick={(e) => e.stopPropagation()}>
        <div className="release-head">
          <span className="label">{showAll ? "Release history" : "What changed"}</span>
          <button className="lightbox-close" style={{ position: "static" }} onClick={dismiss}>×</button>
        </div>
        <div className="release-scroll">
          {list.map((r) => (
            <section className="release" key={r.version}>
              <h2>
                {r.version} <span className="label">{r.date}</span>
              </h2>
              <ul>
                {r.notes.map((note, i) => (
                  <li key={i}>{note}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <div className="release-foot">
          {!showAll && (
            <button className="ghost" onClick={() => setShowAll(true)}>All releases</button>
          )}
          <button onClick={dismiss}>Got it</button>
        </div>
      </div>
    </div>
  );
}
