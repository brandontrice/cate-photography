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
  const [popStyle, setPopStyle] = useState(null);

  function openAt(e) {
    // Fixed positioning, clamped so the panel always fits the viewport,
    // whatever screen the dot lives on.
    const rect = e.currentTarget.getBoundingClientRect();
    const width = Math.min(window.innerWidth - 16, 340);
    const left = Math.min(Math.max(rect.left - 6, 8), window.innerWidth - width - 8);
    const style = { width, left };
    if (window.innerHeight - rect.bottom >= 240 || rect.top < 240) {
      style.top = rect.bottom + 8;
    } else {
      style.bottom = window.innerHeight - rect.top + 8;
    }
    setPopStyle(style);
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
      {on && open && popStyle && (
        <span className="guide-pop" style={popStyle}>
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
