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
      {on ? "Guide on" : "Guide"}
    </button>
  );
}

// A guide annotation. Optional link points to the counterpart location,
// so studio notes can jump to the site and site notes back to the studio.
export function Guide({ children, to, linkLabel }) {
  const [on] = useGuide();
  if (!on) return null;
  return (
    <p className="guide-note">
      <span className="guide-chip">Guide</span>
      <span className="guide-body">
        {children}
        {to && (
          <Link to={to} className="guide-link">
            {linkLabel || "See its place"} ↗
          </Link>
        )}
      </span>
    </p>
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
