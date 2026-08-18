import { createContext, useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase, DEMO } from "../lib/supabase";

// The guide: a toggle that annotates the studio, and the site itself, with
// what each piece does and where it is controlled. State persists per browser.
const GuideContext = createContext([false, () => {}]);

export function GuideProvider({ children }) {
  const [on, setOn] = useState(() => {
    try {
      return localStorage.getItem("studio-guide") === "on";
    } catch {
      return false;
    }
  });
  function toggle() {
    setOn((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("studio-guide", next ? "on" : "off");
      } catch {
        // Private browsing or blocked storage: the toggle still works for the session.
      }
      return next;
    });
  }
  return <GuideContext.Provider value={[on, toggle]}>{children}</GuideContext.Provider>;
}

export function useGuide() {
  return useContext(GuideContext);
}

export function GuideToggle() {
  const [on, toggle] = useGuide();
  return (
    <button className={`ghost guide-toggle${on ? " on" : ""}`} onClick={toggle}>
      {on ? "guide off" : "guide on"}
    </button>
  );
}

// A guide annotation: a small dot that never moves the layout. The dot is
// always rendered (invisible when the guide is off) so toggling shifts
// nothing; hover or tap opens the note as a floating popover.
export function Guide({ children, to, linkLabel }) {
  const [on] = useGuide();
  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState("below");

  function openAt(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    setPlace(window.innerHeight - rect.bottom < 260 ? "above" : "below");
    setOpen(true);
  }

  return (
    <span className={`guide-spot${on ? " on" : ""}`}>
      <button
        type="button"
        className="guide-dot"
        aria-label="Guide"
        tabIndex={on ? 0 : -1}
        onMouseEnter={openAt}
        onMouseLeave={() => setOpen(false)}
        onClick={(e) => (open ? setOpen(false) : openAt(e))}
        onFocus={openAt}
        onBlur={() => setOpen(false)}
      >
        i
      </button>
      {on && open && (
        <span className={`guide-pop pop-${place}`}>
          <span className="guide-chip">guide</span>
          <span className="guide-body">
            {children}
            {to && (
              <Link to={to} className="guide-link">
                {linkLabel || "see its place"} ↗
              </Link>
            )}
          </span>
        </span>
      )}
    </span>
  );
}

// Same annotation, but on public pages: renders only for signed-in accounts,
// so visitors never see the machinery.
export function SiteGuide({ children, to, linkLabel }) {
  const [session, setSession] = useState(null);
  useEffect(() => {
    if (DEMO) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);
  if (DEMO || !session) return null;
  return (
    <Guide to={to} linkLabel={linkLabel}>
      {children}
    </Guide>
  );
}
